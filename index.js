import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createDatabase } from './database.js'
import { createApp } from './app.js'

const db = createDatabase()
const app = createApp({ db })
const port = Number(process.env.PORT) || 3000
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(root, 'dist')
  app.use(express.static(clientDist))
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

const server = app.listen(port, () => {
  console.log(`CreatorFlow API listening on http://localhost:${port}`)
})

function shutdown() {
  server.close(() => {
    db.close()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
