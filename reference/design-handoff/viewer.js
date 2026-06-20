// ============================================================
// DATUM — Visor 3D (Three.js)  ·  Terreno / parcela
// ============================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---- value noise (deterministic) ----------------------------------
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const rnd = mulberry32(20240611);
const PERM = new Float32Array(256*256);
for (let i=0;i<PERM.length;i++) PERM[i]=rnd();
function vnoise(x, y){
  const xi=Math.floor(x), yi=Math.floor(y);
  const xf=x-xi, yf=y-yi;
  const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
  const g=(ix,iy)=>PERM[((ix&255)+((iy&255)*256))&65535];
  const a=g(xi,yi), b=g(xi+1,yi), c=g(xi,yi+1), d=g(xi+1,yi+1);
  return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;
}
function fbm(x,y){
  let s=0,amp=0.5,f=1;
  for(let o=0;o<5;o++){ s+=amp*vnoise(x*f,y*f); f*=2.03; amp*=0.5; }
  return s;
}

// Parcel real-world dimensions (meters)
const PARCEL = { w: 48.6, d: 33.4 }; // surface footprint
const SIZE = 10;                      // scene units across
const SEG = 140;
const HEIGHT = 1.55;

export const Viewer = (() => {
  let renderer, scene, camera, controls, raf;
  let terrainSolid, terrainWire, terrainPoints, gridHelper, boundary, contourGroup;
  let canvas, onDims;
  let elevMin=0, elevMax=1;
  const corners3 = [];     // 4 corner vectors for cotas
  let edgeMids = [];       // midpoints + center for labels

  function heightAt(u, v){
    // u,v in [0,1]
    const n = fbm(u*3.1+10, v*3.1+4);
    const ridge = Math.pow(Math.sin(u*Math.PI*0.9)*Math.cos(v*Math.PI*0.7),2)*0.4;
    const slope = (u*0.35 + v*0.18);
    return (n*0.8 + ridge + slope);
  }

  function buildTerrain(){
    const geo = new THREE.PlaneGeometry(SIZE, SIZE*PARCEL.d/PARCEL.w, SEG, Math.round(SEG*PARCEL.d/PARCEL.w));
    geo.rotateX(-Math.PI/2);
    const pos = geo.attributes.position;
    const colors = [];
    elevMin=Infinity; elevMax=-Infinity;
    const halfX=SIZE/2, halfZ=(SIZE*PARCEL.d/PARCEL.w)/2;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i), z=pos.getZ(i);
      const u=(x+halfX)/SIZE, v=(z+halfZ)/(SIZE*PARCEL.d/PARCEL.w);
      const h=heightAt(u,v)*HEIGHT;
      pos.setY(i,h);
      if(h<elevMin)elevMin=h; if(h>elevMax)elevMax=h;
    }
    // color by elevation
    const c1=new THREE.Color('#1f6f54'), c2=new THREE.Color('#9bb04e'), c3=new THREE.Color('#d9c98f');
    for(let i=0;i<pos.count;i++){
      const t=(pos.getY(i)-elevMin)/(elevMax-elevMin);
      const col = t<0.5 ? c1.clone().lerp(c2, t*2) : c2.clone().lerp(c3,(t-0.5)*2);
      colors.push(col.r,col.g,col.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors,3));
    geo.computeVertexNormals();

    terrainSolid = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors:true, roughness:0.92, metalness:0.02, flatShading:false }));
    terrainSolid.castShadow=true; terrainSolid.receiveShadow=true;

    const wmat = new THREE.MeshBasicMaterial({ color:0x34d399, wireframe:true, transparent:true, opacity:0.42 });
    terrainWire = new THREE.Mesh(geo, wmat); terrainWire.visible=false;

    const pmat = new THREE.PointsMaterial({ size:0.018, vertexColors:true, sizeAttenuation:true });
    terrainPoints = new THREE.Points(geo, pmat); terrainPoints.visible=false;

    // corners (for cotas)
    corners3.length=0;
    const cs=[[-halfX,-halfZ],[halfX,-halfZ],[halfX,halfZ],[-halfX,halfZ]];
    for(const [x,z] of cs){
      const u=(x+halfX)/SIZE, v=(z+halfZ)/(SIZE*PARCEL.d/PARCEL.w);
      corners3.push(new THREE.Vector3(x, heightAt(u,v)*HEIGHT+0.04, z));
    }
    // boundary line
    const bpts=[...corners3, corners3[0]];
    boundary = new THREE.Line(new THREE.BufferGeometry().setFromPoints(bpts),
      new THREE.LineBasicMaterial({ color:0x34d399, transparent:true, opacity:0.9 }));
    // vertical drop posts at corners
    const grp=new THREE.Group(); grp.add(boundary);
    corners3.forEach(c=>{
      const g=new THREE.BufferGeometry().setFromPoints([c.clone(), new THREE.Vector3(c.x,elevMin-0.3,c.z)]);
      grp.add(new THREE.Line(g, new THREE.LineBasicMaterial({color:0x34d399, transparent:true, opacity:0.25})));
    });
    boundary = grp;

    // label anchor points: 4 edge midpoints + center (area)
    edgeMids = [];
    for(let i=0;i<4;i++){
      const a=corners3[i], b=corners3[(i+1)%4];
      edgeMids.push({ type:'edge', idx:i, p:a.clone().add(b).multiplyScalar(0.5).add(new THREE.Vector3(0,0.25,0)) });
    }
    const ctr = corners3.reduce((s,c)=>s.add(c.clone()),new THREE.Vector3()).multiplyScalar(0.25);
    edgeMids.push({ type:'area', p:ctr.add(new THREE.Vector3(0,0.6,0)) });

    // contour lines
    contourGroup = buildContours(geo, halfX, halfZ);
  }

  function buildContours(geo, halfX, halfZ){
    const grp=new THREE.Group();
    const levels=7;
    for(let l=1;l<levels;l++){
      const y = elevMin + (elevMax-elevMin)*(l/levels);
      const pts=[];
      const pos=geo.attributes.position;
      // marching over grid rows
      const cols=SEG+1, rows=Math.round(SEG*PARCEL.d/PARCEL.w)+1;
      for(let r=0;r<rows-1;r++){
        for(let c=0;c<cols-1;c++){
          const i=r*cols+c;
          const yy=[pos.getY(i),pos.getY(i+1),pos.getY(i+cols),pos.getY(i+cols+1)];
          const mn=Math.min(...yy), mx=Math.max(...yy);
          if(y>mn&&y<mx){
            const xx=pos.getX(i), zz=pos.getZ(i);
            pts.push(new THREE.Vector3(xx, y+0.01, zz));
          }
        }
      }
      if(pts.length){
        const m=new THREE.PointsMaterial({ color:0xffffff, size:0.012, transparent:true, opacity:0.18 });
        grp.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts), m));
      }
    }
    grp.visible=false;
    return grp;
  }

  function init(canvasEl, dimsCb){
    canvas = canvasEl; onDims = dimsCb;
    renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(7.5, 6.2, 9);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping=true; controls.dampingFactor=0.08;
    controls.minDistance=4; controls.maxDistance=22;
    controls.maxPolarAngle=Math.PI*0.49;
    controls.target.set(0,0.4,0);
    controls.autoRotate=false; controls.autoRotateSpeed=0.6;

    // lights
    const hemi=new THREE.HemisphereLight(0xcfe8ff,0x2a2a1f,0.85); scene.add(hemi);
    const sun=new THREE.DirectionalLight(0xffffff,1.6);
    sun.position.set(6,11,4); sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.near=1; sun.shadow.camera.far=40;
    sun.shadow.camera.left=-9; sun.shadow.camera.right=9; sun.shadow.camera.top=9; sun.shadow.camera.bottom=-9;
    sun.shadow.bias=-0.0003; scene.add(sun);

    buildTerrain();
    scene.add(terrainSolid, terrainWire, terrainPoints, boundary, contourGroup);

    gridHelper = new THREE.GridHelper(28, 56);
    gridHelper.position.y = elevMin-0.32;
    gridHelper.material.transparent=true; gridHelper.material.opacity=0.10;
    scene.add(gridHelper);

    applyTheme();
    resize();
    addEventListener('resize', resize);
    loop();
  }

  function loop(){
    raf=requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene,camera);
    if(onDims) projectDims();
  }

  function projectDims(){
    const w=canvas.clientWidth, h=canvas.clientHeight;
    const out=edgeMids.map(m=>{
      const v=m.p.clone().project(camera);
      return { type:m.type, idx:m.idx, x:(v.x*0.5+0.5)*w, y:(-v.y*0.5+0.5)*h, vis:v.z<1 };
    });
    onDims(out);
  }

  // ---- public controls ----
  function setMode(mode){
    terrainSolid.visible = mode==='solid';
    terrainWire.visible  = mode==='wire';
    terrainPoints.visible= mode==='points';
    if(mode==='points'){ terrainPoints.material.size = 0.02; }
  }
  function toggleLayer(name, on){
    if(name==='boundary') boundary.visible=on;
    if(name==='contours') contourGroup.visible=on;
    if(name==='grid') gridHelper.visible=on;
  }
  function setAutoRotate(on){ controls.autoRotate=on; }
  function resetView(){
    animateCam(new THREE.Vector3(7.5,6.2,9), new THREE.Vector3(0,0.4,0));
  }
  function topView(){ animateCam(new THREE.Vector3(0.01,13,0.01), new THREE.Vector3(0,0,0)); }
  function frontView(){ animateCam(new THREE.Vector3(0,2.4,12), new THREE.Vector3(0,0.4,0)); }

  function animateCam(toPos, toTgt){
    const fromPos=camera.position.clone(), fromTgt=controls.target.clone();
    const t0=performance.now(), dur=720;
    (function a(){
      const k=Math.min(1,(performance.now()-t0)/dur);
      const e=1-Math.pow(1-k,3);
      camera.position.lerpVectors(fromPos,toPos,e);
      controls.target.lerpVectors(fromTgt,toTgt,e);
      if(k<1) requestAnimationFrame(a);
    })();
  }

  function applyTheme(){
    const cs=getComputedStyle(document.documentElement);
    const top=cs.getPropertyValue('--scene-top').trim()||'#0e1318';
    const bot=cs.getPropertyValue('--scene-bot').trim()||'#05070a';
    const acc=cs.getPropertyValue('--accent').trim()||'#34d399';
    scene.background=null;
    if(renderer) renderer.setClearColor(0x000000,0);
    paintBackdrop(top,bot);
    const ac=new THREE.Color(acc);
    if(terrainWire) terrainWire.material.color=ac;
    if(boundary) boundary.children.forEach(ch=>{ if(ch.material) ch.material.color=ac; });
    const light = cs.getPropertyValue('--text').trim().startsWith('#1')||cs.getPropertyValue('--bg').trim()==='#f3f4f1';
    if(gridHelper) gridHelper.material.opacity = light?0.16:0.10;
    if(contourGroup) contourGroup.children.forEach(ch=>{ ch.material.color=new THREE.Color(light?0x333333:0xffffff); ch.material.opacity=light?0.22:0.18; });
  }
  let backdropEl;
  function paintBackdrop(top,bot){
    if(!backdropEl){ backdropEl=document.createElement('div'); backdropEl.style.cssText='position:absolute;inset:0;z-index:0;pointer-events:none;'; canvas.parentElement.insertBefore(backdropEl, canvas); canvas.style.position='relative'; canvas.style.zIndex='1'; }
    backdropEl.style.background=`radial-gradient(120% 90% at 60% 15%, ${top}, ${bot})`;
  }

  function resize(){
    if(!canvas) return;
    const w=canvas.clientWidth, h=canvas.clientHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/h; camera.updateProjectionMatrix();
  }

  function getMetrics(){
    const slopePct = ((elevMax-elevMin)/(PARCEL.w/ (SIZE/ (SIZE)) )); // arbitrary scaled
    return {
      area: (PARCEL.w*PARCEL.d).toFixed(1),
      width: PARCEL.w.toFixed(2),
      depth: PARCEL.d.toFixed(2),
      perimeter: (2*(PARCEL.w+PARCEL.d)).toFixed(1),
      elevMin: (820.4).toFixed(1),
      elevMax: (820.4 + (elevMax-elevMin)*(PARCEL.w/SIZE)).toFixed(1),
      drop: ((elevMax-elevMin)*(PARCEL.w/SIZE)).toFixed(2),
    };
  }

  return { init, setMode, toggleLayer, setAutoRotate, resetView, topView, frontView, applyTheme, getMetrics,
           dims: { PARCEL } };
})();

window.Viewer = Viewer;
