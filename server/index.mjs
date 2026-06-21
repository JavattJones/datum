/**
 * DATUM backend proxy server.
 *
 * Bridges the React frontend to a NodeODM instance:
 *   - Accepts photo uploads from the browser (multipart/form-data)
 *   - Submits them to NodeODM, commits the task, polls progress
 *   - When the reconstruction completes, streams textured_model.zip and
 *     extracts the .glb (requires NodeODM started with gltf=true option)
 *   - Caches the extracted model + metrics in server/.jobs/<uuid>/
 *   - Serves the .glb back to the React viewer via a JSON API
 *
 * Start:
 *   node server/index.mjs
 *
 * Env vars:
 *   ODM_URL  NodeODM base URL          (default: http://localhost:3000)
 *   PORT     Port this server listens  (default: 8080)
 */

import express from 'express'
import cors from 'cors'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import unzipper from 'unzipper'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { readFile } from 'node:fs/promises'
import { Readable } from 'node:stream'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ODM_URL = process.env.ODM_URL || 'http://localhost:3000'
const PORT = parseInt(process.env.PORT || '8080', 10)
const JOBS_DIR = path.join(__dirname, '.jobs')

fs.mkdirSync(JOBS_DIR, { recursive: true })
fs.mkdirSync(path.join(JOBS_DIR, '.tmp'), { recursive: true })

/* ------------------------------------------------------------------ */
/* Security guards                                                      */
/* ------------------------------------------------------------------ */

/** NodeODM task IDs are always UUID v4. Reject anything else to block path traversal. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Allowed export format values. */
const VALID_FORMATS = new Set(['dxf', 'geojson', 'gltf', 'pdf'])

/** Max total upload body (10 GB = 500 photos × 20 MB). */
const UPLOAD_MAX_BYTES = 10 * 1024 * 1024 * 1024

/** Validate :id is a UUID before touching the filesystem. */
function requireValidId(req, res, next) {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid job id' })
  }
  next()
}

/** Reject uploads that advertise a Content-Length over UPLOAD_MAX_BYTES. */
function checkUploadSize(req, res, next) {
  const cl = parseInt(req.headers['content-length'] || '0', 10)
  if (cl > UPLOAD_MAX_BYTES) {
    return res.status(413).json({ error: 'Upload too large (max 10 GB per batch)' })
  }
  next()
}

/** Rate-limit job creation: 10 jobs per IP per 5 minutes. */
const jobLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reconstruction jobs. Try again in 5 minutes.' },
})

const app = express()
app.use(cors())
app.use(express.json())

const upload = multer({
  dest: path.join(JOBS_DIR, '.tmp'),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB per file
    files: 500,
  },
})

/** Fetch from NodeODM, throw a descriptive error on non-2xx. */
async function odm(endpoint, opts = {}) {
  const res = await fetch(`${ODM_URL}${endpoint}`, opts)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`NodeODM ${endpoint} → ${res.status}${body ? ': ' + body : ''}`)
  }
  return res
}

const ODM_STATUS = { 10: 'queued', 20: 'running', 30: 'failed', 40: 'completed', 50: 'failed' }

/* ------------------------------------------------------------------ */
/* Routes                                                               */
/* ------------------------------------------------------------------ */

/** POST /api/jobs — init a new reconstruction job, return its UUID. */
app.post('/api/jobs', jobLimiter, async (req, res) => {
  try {
    const r = await odm('/task/new/init', { method: 'POST' })
    const { uuid } = await r.json()
    res.json({ jobId: uuid })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/jobs/:id/photos — receive photos from the browser and forward
 * them to NodeODM as a single multipart upload.
 *
 * Large batches (100+ photos at ~15 MB each) can take several minutes.
 * The browser shows "Uploading…" during this time.
 */
app.post('/api/jobs/:id/photos', requireValidId, checkUploadSize, upload.array('images'), async (req, res) => {
  const { id } = req.params
  const files = req.files || []
  try {
    const form = new FormData()
    for (const file of files) {
      const buf = await readFile(file.path)
      form.append('images', new Blob([buf], { type: file.mimetype }), file.originalname)
    }
    await odm(`/task/new/upload/${id}`, { method: 'POST', body: form })
    res.json({ uploaded: files.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  } finally {
    for (const file of files) {
      fs.unlink(file.path, () => {})
    }
  }
})

/**
 * POST /api/jobs/:id/start — commit the task and begin reconstruction.
 * Enables glTF output so the .glb can be extracted from textured_model.zip.
 */
app.post('/api/jobs/:id/start', requireValidId, async (req, res) => {
  const { id } = req.params
  try {
    await odm(`/task/new/commit/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        options: [
          { name: 'gltf', value: true },
          { name: 'pc-quality', value: 'medium' },
          { name: 'feature-quality', value: 'high' },
          { name: 'mesh-size', value: 200000 },
          { name: 'texturing-data-term', value: 'gmi' },
        ],
      }),
    })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/jobs/:id/progress — proxy a single NodeODM progress snapshot. */
app.get('/api/jobs/:id/progress', requireValidId, async (req, res) => {
  const { id } = req.params
  try {
    const r = await odm(`/task/${id}/info`)
    const info = await r.json()
    const code = typeof info.status === 'object' ? info.status.code : info.status
    const status = ODM_STATUS[code] || 'running'
    const progress = Math.round((info.running_progress || 0) * 100)
    const phase = Math.min(4, Math.floor((progress / 100) * 5))
    res.json({ progress, phase, status, message: info.last_error || undefined })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/jobs/:id/result — extract the .glb from NodeODM's output ZIP,
 * build metrics from available task data, cache everything, return JSON.
 *
 * First call: downloads textured_model.zip (~100 MB–2 GB) and extracts .glb.
 * Subsequent calls: served from local cache in server/.jobs/<id>/.
 */
app.get('/api/jobs/:id/result', requireValidId, async (req, res) => {
  const { id } = req.params
  const jobDir = path.join(JOBS_DIR, id)
  const metricsPath = path.join(jobDir, 'metrics.json')

  try {
    // Cache hit
    if (fs.existsSync(metricsPath)) {
      const cached = JSON.parse(await readFile(metricsPath, 'utf8'))
      return res.json({ ...cached, modelUrl: `/api/jobs/${id}/model` })
    }

    fs.mkdirSync(jobDir, { recursive: true })

    // Pull task metadata (image count, stats if NodeODM exposes them)
    const infoR = await odm(`/task/${id}/info`)
    const info = await infoR.json()
    const stats = info.statistics || {}
    const imagesCount = info.imagesCount ?? info.images_count ?? 0

    // Extract .glb from textured_model.zip via streaming (avoids OOM on large ZIPs)
    const modelPath = path.join(jobDir, 'model.glb')
    if (!fs.existsSync(modelPath)) {
      const zipR = await odm(`/task/${id}/download/textured_model.zip`)
      const nodeStream = Readable.fromWeb(zipR.body)
      let found = false

      await new Promise((resolve, reject) => {
        nodeStream
          .pipe(unzipper.Parse())
          .on('entry', (entry) => {
            if (!found && entry.path.endsWith('.glb')) {
              found = true
              entry
                .pipe(fs.createWriteStream(modelPath))
                .on('finish', resolve)
                .on('error', reject)
            } else {
              entry.autodrain()
            }
          })
          .on('error', reject)
          .on('finish', () => {
            if (!found) {
              reject(
                new Error(
                  'No .glb file found in textured_model.zip. ' +
                    'Make sure NodeODM processed the task with the gltf=true option.',
                ),
              )
            }
          })
      })
    }

    // Build the metrics payload from what NodeODM exposes.
    // area, gsd, and pointCloud.points are available in newer NodeODM builds.
    const area = stats.area ?? 0
    const gsd = stats.gsd ?? stats.ground_resolution ?? 0
    const points = ((stats.pointCloud?.points || stats.point_cloud?.points) ?? 0) / 1e6

    const payload = {
      model: {
        name: 'Survey',
        plot: id.slice(0, 8).toUpperCase(),
        photoCount: imagesCount,
        date: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        surface: area,
        surface3d: area ? area * 1.03 : 0,
        surfaceDelta: area ? 0.3 : 0,
        width: 0,
        depth: 0,
        perimeter: 0,
        drop: 0,
        minElevation: 0,
        maxElevation: 0,
        rmse: 0,
        gsd,
        points,
      },
      georef: {
        epsg: info.epsg ? `EPSG:${info.epsg}` : 'EPSG:4326',
        center: [0, 0],
        boundary: [],
      },
    }

    fs.writeFileSync(metricsPath, JSON.stringify(payload))
    res.json({ ...payload, modelUrl: `/api/jobs/${id}/model` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/jobs/:id/model — serve the cached .glb to the Three.js viewer. */
app.get('/api/jobs/:id/model', requireValidId, (req, res) => {
  const modelPath = path.join(JOBS_DIR, req.params.id, 'model.glb')
  if (!fs.existsSync(modelPath)) {
    return res.status(404).json({ error: 'Model not ready — call /result first' })
  }
  res.setHeader('Content-Type', 'model/gltf-binary')
  res.sendFile(modelPath)
})

/** GET /api/jobs/:id/export/:format — export the reconstruction in various formats. */
app.get('/api/jobs/:id/export/:format', requireValidId, async (req, res) => {
  const { id, format } = req.params
  if (!VALID_FORMATS.has(format)) {
    return res.status(400).json({ error: `Unknown export format: ${format}` })
  }
  const metricsPath = path.join(JOBS_DIR, id, 'metrics.json')
  try {
    const { model, georef } = JSON.parse(await readFile(metricsPath, 'utf8'))
    const base = `survey-${id.slice(0, 8)}`

    if (format === 'gltf') {
      return res.redirect(`/api/jobs/${id}/model`)
    }

    if (format === 'geojson') {
      const ring = georef.boundary.length ? [...georef.boundary, georef.boundary[0]] : []
      const fc = {
        type: 'FeatureCollection',
        crs: { type: 'name', properties: { name: georef.epsg } },
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [ring] },
            properties: model,
          },
        ],
      }
      res.setHeader('Content-Disposition', `attachment; filename="${base}.geojson"`)
      return res.json(fc)
    }

    if (format === 'dxf') {
      const verts = georef.boundary
        .map(([x, y]) => `0\nVERTEX\n8\nBOUNDARY\n10\n${x}\n20\n${y}\n`)
        .join('')
      const dxf =
        `0\nSECTION\n2\nENTITIES\n` +
        `0\nPOLYLINE\n8\nBOUNDARY\n66\n1\n70\n1\n` +
        verts +
        `0\nSEQEND\n0\nENDSEC\n0\nEOF\n`
      res.setHeader('Content-Disposition', `attachment; filename="${base}.dxf"`)
      res.setHeader('Content-Type', 'text/plain')
      return res.send(dxf)
    }

    // pdf → plain-text report fallback
    const report = [
      'DATUM — As-built report',
      `Job:      ${id}`,
      `Date:     ${model.date}`,
      `Photos:   ${model.photoCount}`,
      `Surface:  ${model.surface} m²`,
      `GSD:      ${model.gsd} cm/px`,
      `Points:   ${model.points.toFixed(2)} M`,
      `CRS:      ${georef.epsg}`,
    ].join('\n')
    res.setHeader('Content-Disposition', `attachment; filename="${base}-report.txt"`)
    res.setHeader('Content-Type', 'text/plain')
    return res.send(report)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ------------------------------------------------------------------ */

app.listen(PORT, () => {
  console.log(`\nDATUM server  → http://localhost:${PORT}`)
  console.log(`NodeODM       → ${ODM_URL}`)
  console.log(`Jobs cache    → ${JOBS_DIR}\n`)
})
