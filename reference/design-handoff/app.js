// ============================================================
// DATUM — App logic
// ============================================================
import { Viewer } from './viewer.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// ---------- screen router ----------
function show(id){
  $$('.screen').forEach(s=>s.classList.toggle('active', s.id===id));
}

// ---------- THEME ----------
const themeSwitch = $('#themeSwitch');
themeSwitch.addEventListener('click', e=>{
  const b = e.target.closest('button'); if(!b) return;
  const val = b.dataset.themeVal;
  document.documentElement.setAttribute('data-theme', val);
  $$('#themeSwitch button').forEach(x=>x.setAttribute('aria-pressed', x===b));
  if(window.__viewerReady){ Viewer.applyTheme(); drawMap(); }
});

// ============================================================
// SCREEN 1 — UPLOAD
// ============================================================
const thumbs = $('#thumbs');
const uploadFoot = $('#uploadFoot');
const dropzone = $('#dropzone');
let photoN = 0;

const palettes = [
  ['#3d5a3a','#6b8e4e','#a8b56a'], ['#4a6741','#7a9b5a','#c2c081'],
  ['#2f4a35','#5c7d48','#9aae5f'], ['#5a6b3c','#8a9b54','#bcc488'],
  ['#3a5240','#688a52','#a6b870'], ['#465c38','#7d985a','#cabf86'],
];
function makeThumb(i){
  const wrap = document.createElement('div');
  wrap.className = 'thumb'; wrap.style.animationDelay = (i*0.025)+'s';
  const c = document.createElement('canvas'); c.width=160; c.height=120;
  const x = c.getContext('2d');
  const pal = palettes[i%palettes.length];
  // base terrain wash
  const g = x.createLinearGradient(0,0,160,120);
  g.addColorStop(0,pal[0]); g.addColorStop(0.55,pal[1]); g.addColorStop(1,pal[2]);
  x.fillStyle=g; x.fillRect(0,0,160,120);
  // field rows / parcels
  x.save(); x.translate(80,60); x.rotate((i*37%90-45)*Math.PI/180);
  x.globalAlpha=0.18; x.strokeStyle='#1c2a16'; x.lineWidth=1;
  for(let k=-120;k<120;k+=9){ x.beginPath(); x.moveTo(k,-120); x.lineTo(k,120); x.stroke(); }
  x.restore();
  // patches
  for(let k=0;k<5;k++){
    x.globalAlpha=0.12+Math.random()*0.16;
    x.fillStyle = Math.random()>0.5?'#27381c':'#c9cf95';
    const px=Math.random()*160, py=Math.random()*120, pr=14+Math.random()*30;
    x.beginPath(); x.ellipse(px,py,pr,pr*0.7,Math.random()*3,0,7); x.fill();
  }
  // path/road
  x.globalAlpha=0.5; x.strokeStyle='#d8d2b4'; x.lineWidth=2.4;
  x.beginPath(); x.moveTo(-5,30+i%40); x.bezierCurveTo(50,60,110,40,165,80+i%20); x.stroke();
  x.globalAlpha=1;
  // vignette
  const v=x.createRadialGradient(80,60,20,80,60,100); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.28)');
  x.fillStyle=v; x.fillRect(0,0,160,120);
  wrap.appendChild(c);
  const tg=document.createElement('span'); tg.className='tg'; tg.textContent='IMG_'+String(2040+i).padStart(4,'0');
  wrap.appendChild(tg);
  const chk=document.createElement('span'); chk.className='chk';
  chk.innerHTML='<svg viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  wrap.appendChild(chk);
  return wrap;
}
function addPhotos(n){
  for(let i=0;i<n;i++){ thumbs.appendChild(makeThumb(photoN+i)); }
  photoN += n;
  $('#photoCount').textContent = photoN;
  uploadFoot.style.display = 'flex';
}

$('#btnSample').addEventListener('click', ()=>{ if(photoN===0) addPhotos(18); });
$('#btnBrowse').addEventListener('click', ()=>{ if(photoN===0) addPhotos(18); });
$('#btnProcess').addEventListener('click', startProcessing);

// drag & drop visual
['dragenter','dragover'].forEach(ev=>dropzone.addEventListener(ev, e=>{e.preventDefault(); dropzone.classList.add('drag');}));
['dragleave','drop'].forEach(ev=>dropzone.addEventListener(ev, e=>{e.preventDefault(); dropzone.classList.remove('drag');}));
dropzone.addEventListener('drop', ()=> addPhotos(18));

// ============================================================
// SCREEN 2 — PROCESSING
// ============================================================
const STEPS = [
  { ico:'align', t:'Alineando fotografías', s:'Detectando puntos clave y estimando posiciones de cámara…' },
  { ico:'cloud', t:'Generando nube de puntos densa', s:'Triangulando 2.1 M de puntos a partir del solape…' },
  { ico:'mesh',  t:'Construyendo malla 3D', s:'Reconstruyendo superficie y normales del terreno…' },
  { ico:'tex',   t:'Proyectando texturas', s:'Mapeando color fotográfico sobre la geometría…' },
  { ico:'geo',   t:'Georreferenciando as-built', s:'Aplicando escala métrica y sistema de coordenadas…' },
];
const STEP_ICONS = {
  align:'<path d="M4 4h6v6H4zM14 14h6v6h-6zM10 7h4v0M7 10v4" stroke="currentColor" stroke-width="1.6"/>',
  cloud:'<circle cx="7" cy="9" r="1.2" fill="currentColor"/><circle cx="13" cy="6" r="1.2" fill="currentColor"/><circle cx="17" cy="11" r="1.2" fill="currentColor"/><circle cx="9" cy="14" r="1.2" fill="currentColor"/><circle cx="15" cy="16" r="1.2" fill="currentColor"/>',
  mesh:'<path d="M12 3 3 8v8l9 5 9-5V8l-9-5ZM3 8l9 5 9-5M12 13v8" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  tex:'<rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="m4 15 4-4 5 5M14 13l2-2 4 4" stroke="currentColor" stroke-width="1.5"/>',
  geo:'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" stroke="currentColor" stroke-width="1.3"/>',
};
const procSteps = $('#procSteps');
STEPS.forEach((st,i)=>{
  const el=document.createElement('div'); el.className='proc-step'; el.id='pstep-'+i;
  el.innerHTML = `<span class="ps-ico"><svg viewBox="0 0 24 24" fill="none">${STEP_ICONS[st.ico]}</svg></span><span>${st.t}</span>`;
  procSteps.appendChild(el);
});
const ringFill = $('#ringFill');
const RING_LEN = 276.5;

let procTimer=null;
function startProcessing(){
  show('screen-processing');
  const dur=5000, t0=Date.now();
  let curStep=-1, done=false;
  if(procTimer) clearInterval(procTimer);
  function tick(){
    const k=Math.min(1,(Date.now()-t0)/dur);
    $('#procPct').textContent = Math.round(k*100)+'%';
    ringFill.style.strokeDashoffset = RING_LEN*(1-k);
    const si = Math.min(STEPS.length-1, Math.floor(k*STEPS.length));
    if(si!==curStep){
      curStep=si;
      $('#procTitle').textContent = STEPS[si].t;
      $('#procSub').textContent = STEPS[si].s;
      STEPS.forEach((_,i)=>{
        const el=$('#pstep-'+i);
        el.classList.toggle('done', i<si);
        el.classList.toggle('active', i===si);
        const ico=el.querySelector('.ps-ico');
        if(i<si) ico.innerHTML='<svg viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        else if(i===si) ico.innerHTML='<span class="spinner"></span>';
        else ico.innerHTML=`<svg viewBox="0 0 24 24" fill="none">${STEP_ICONS[STEPS[i].ico]}</svg>`;
      });
    }
    if(k>=1 && !done){
      done=true; clearInterval(procTimer); procTimer=null;
      // mark all done
      STEPS.forEach((_,i)=>{ const el=$('#pstep-'+i); el.classList.remove('active'); el.classList.add('done'); el.querySelector('.ps-ico').innerHTML='<svg viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; });
      setTimeout(enterViewer, 420);
    }
  }
  tick();
  procTimer=setInterval(tick, 60);
}

// ============================================================
// SCREEN 3 — VIEWER
// ============================================================
const overlay = $('#overlay');
let dimEls = {};
function ensureDimEls(){
  if(dimEls.area) return;
  for(let i=0;i<4;i++){ const e=document.createElement('div'); e.className='dim-label'; overlay.appendChild(e); dimEls['e'+i]=e; }
  const a=document.createElement('div'); a.className='dim-label area'; overlay.appendChild(a); dimEls.area=a;
}
const P = Viewer.dims.PARCEL;
const EDGE_TXT = [ P.w.toFixed(1)+' m', P.d.toFixed(1)+' m', P.w.toFixed(1)+' m', P.d.toFixed(1)+' m' ];

function onDims(pts){
  ensureDimEls();
  pts.forEach(p=>{
    if(p.type==='area'){
      dimEls.area.style.left=p.x+'px'; dimEls.area.style.top=p.y+'px';
      dimEls.area.textContent = (P.w*P.d).toFixed(0)+' m²';
      dimEls.area.style.display = p.vis?'block':'none';
    } else {
      const e=dimEls['e'+p.idx]; if(!e) return;
      e.style.left=p.x+'px'; e.style.top=p.y+'px';
      e.textContent = EDGE_TXT[p.idx];
      e.style.display = p.vis?'block':'none';
    }
  });
}

function enterViewer(){
  show('screen-viewer');
  setTimeout(()=>{
    if(!window.__viewerReady){
      Viewer.init($('#scene'), onDims);
      window.__viewerReady = true;
      drawMap();
    }
  }, 60);
}

// mode group
$('#modeGroup').addEventListener('click', e=>{
  const b=e.target.closest('.mode-btn'); if(!b) return;
  $$('#modeGroup .mode-btn').forEach(x=>x.setAttribute('aria-pressed', x===b));
  Viewer.setMode(b.dataset.mode);
});

// view tools
$('#vReset').addEventListener('click', ()=>Viewer.resetView());
$('#vTop').addEventListener('click', ()=>Viewer.topView());
$('#vFront').addEventListener('click', ()=>Viewer.frontView());
const vRotate=$('#vRotate');
vRotate.addEventListener('click', ()=>{
  const on = vRotate.getAttribute('aria-pressed')!=='true';
  vRotate.setAttribute('aria-pressed', on);
  Viewer.setAutoRotate(on);
});
$('#vMeasure').addEventListener('click', e=>{
  const b=e.currentTarget; const on=b.getAttribute('aria-pressed')!=='true';
  b.setAttribute('aria-pressed', on);
  overlay.style.outline = on ? '1px dashed var(--accent-line)' : 'none';
});
$('#vFull').addEventListener('click', ()=>{
  const el=document.documentElement;
  if(!document.fullscreenElement) el.requestFullscreen?.(); else document.exitFullscreen?.();
});

// layers
$$('.toggle[data-layer]').forEach(t=>{
  t.addEventListener('click', ()=>{
    const on = t.getAttribute('aria-pressed')!=='true';
    t.setAttribute('aria-pressed', on);
    Viewer.toggleLayer(t.dataset.layer, on);
  });
});

// relocate (animate coord + map)
let coords=[[40.4168,-3.7038],[41.3874,2.1686],[37.3891,-5.9845],[39.4699,-0.3763]];
let ci=0;
$('#btnRelocate').addEventListener('click', ()=>{
  ci=(ci+1)%coords.length;
  const [la,lo]=coords[ci];
  $('#mapCoord').textContent = `${Math.abs(la).toFixed(4)}° ${la>=0?'N':'S'} · ${Math.abs(lo).toFixed(4)}° ${lo>=0?'E':'O'}`;
  drawMap(true);
});

// new / export
$('#btnNew').addEventListener('click', ()=>{ show('screen-upload'); });
$('#btnExport').addEventListener('click', ()=>{
  const b=$('#btnExport'); const old=b.innerHTML;
  b.innerHTML='<span class="spinner" style="border-top-color:#04130d;"></span> Generando…';
  setTimeout(()=>{ b.innerHTML='<svg viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg> Exportado'; setTimeout(()=>b.innerHTML=old,1600); }, 1400);
});

// mobile inspector
$('#inspTab').addEventListener('click', ()=> $('#inspector').classList.toggle('open'));

// ---------- mini map ----------
function drawMap(animated){
  const c=$('#mapCanvas'); if(!c) return;
  const x=c.getContext('2d'); const W=c.width,H=c.height;
  const cs=getComputedStyle(document.documentElement);
  const acc=cs.getPropertyValue('--accent').trim();
  const panel=cs.getPropertyValue('--panel-2').trim();
  const stroke=cs.getPropertyValue('--stroke-2').trim();
  const isLight = cs.getPropertyValue('--bg').trim()==='#f3f4f1';
  x.fillStyle = isLight ? '#e8ebe5' : '#0c1116'; x.fillRect(0,0,W,H);
  // grid streets
  x.strokeStyle = stroke; x.globalAlpha=0.5; x.lineWidth=1;
  const off=(ci*40)%80;
  for(let gx=-off; gx<W; gx+=64){ x.beginPath(); x.moveTo(gx,0); x.lineTo(gx+40,H); x.stroke(); }
  for(let gy=20; gy<H; gy+=50){ x.beginPath(); x.moveTo(0,gy); x.lineTo(W,gy-26); x.stroke(); }
  x.globalAlpha=1;
  // a couple blocks
  x.fillStyle = isLight ? '#dfe3dc' : '#11171e';
  for(let k=0;k<6;k++){ const bx=(k*97+ci*30)%W, by=(k*61)%H; x.fillRect(bx,by,46,30); }
  // river
  x.strokeStyle = isLight ? '#bcd0d8' : '#16323b'; x.lineWidth=10; x.globalAlpha=0.8;
  x.beginPath(); x.moveTo(-10,H*0.2+ci*8); x.bezierCurveTo(W*0.3,H*0.5,W*0.6,H*0.3,W+10,H*0.7); x.stroke();
  x.globalAlpha=1;
  // parcel polygon (center)
  const cx=W/2, cy=H*0.5;
  x.save(); x.translate(cx,cy); x.rotate(0.18+ci*0.3);
  x.beginPath(); x.moveTo(-46,-30); x.lineTo(48,-26); x.lineTo(42,30); x.lineTo(-50,26); x.closePath();
  x.fillStyle = acc+'33'; x.fill();
  x.strokeStyle = acc; x.lineWidth=2; x.stroke();
  // corner ticks
  x.fillStyle=acc; [[-46,-30],[48,-26],[42,30],[-50,26]].forEach(p=>{ x.beginPath(); x.arc(p[0],p[1],2.6,0,7); x.fill(); });
  x.restore();
}

// initial map (also redraws on theme)
window.addEventListener('load', ()=>{ /* map drawn on viewer enter */ });

// ---------- direct-jump shortcut (for capture / deep-link) ----------
// ?jump=viewer  -> skip upload+processing, land straight in the 3D viewer
const __jump = new URLSearchParams(location.search).get('jump');
if(__jump==='viewer'){
  addPhotos(18);
  enterViewer();
} else if(__jump==='processing'){
  // static processing snapshot at ~62% with step 3 active (no timer)
  addPhotos(18);
  show('screen-processing');
  const k=0.62;
  $('#procPct').textContent = Math.round(k*100)+'%';
  ringFill.style.strokeDashoffset = RING_LEN*(1-k);
  const si=2;
  $('#procTitle').textContent = STEPS[si].t;
  $('#procSub').textContent = STEPS[si].s;
  STEPS.forEach((_,i)=>{
    const el=$('#pstep-'+i);
    el.classList.toggle('done', i<si);
    el.classList.toggle('active', i===si);
    const ico=el.querySelector('.ps-ico');
    if(i<si) ico.innerHTML='<svg viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    else if(i===si) ico.innerHTML='<span class="spinner"></span>';
  });
} else if(__jump==='thumbs'){
  addPhotos(18);
}
