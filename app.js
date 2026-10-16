import crypto from 'node:crypto'
import express from 'express'
import session from 'express-session'
import bcrypt from 'bcryptjs'
import helmet from 'helmet'
import { z } from 'zod'
import { SQLiteSessionStore } from './session-store.js'

const platforms = ['YouTube', 'Instagram', 'LinkedIn', 'Other']
const statuses = ['Idea', 'Draft', 'Ready', 'Scheduled', 'Published (demo)', 'Cancelled']
const emailSchema = z.string().trim().email().max(254).transform((email) => email.toLowerCase())
const registrationSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters.').max(72),
})
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.').max(72),
})
const contentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(120),
  body: z.string().max(5000).default(''),
  platform: z.enum(platforms),
  status: z.enum(statuses),
  scheduledAt: z.string().nullable().optional(),
}).superRefine((post, context) => {
  if (post.status === 'Scheduled') {
    const timestamp = post.scheduledAt ? Date.parse(post.scheduledAt) : NaN
    if (!Number.isFinite(timestamp)) {
      context.addIssue({ code: 'custom', path: ['scheduledAt'], message: 'Choose a valid date and time for a scheduled post.' })
    }
  }
})
const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
  email: emailSchema,
})

function validationMessage(error) {
  return error.issues[0]?.message || 'Please check the information and try again.'
}

function validate(schema, value, res) {
  const result = schema.safeParse(value)
  if (!result.success) {
    res.status(400).json({ error: validationMessage(result.error) })
    return null
  }
  return result.data
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email }
}

function csrfToken() {
  return crypto.randomBytes(32).toString('hex')
}

function postFromRow(row) {
  return { ...row, scheduledAt: row.scheduled_at, createdAt: row.created_at, updatedAt: row.updated_at,
    scheduled_at: undefined, created_at: undefined, updated_at: undefined }
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}

export function createApp({ db, sessionSecret = process.env.SESSION_SECRET, production = process.env.NODE_ENV === 'production' }) {
  if (!db) throw new Error('A database connection is required.')
  if (production && (!sessionSecret || sessionSecret.length < 32)) {
    throw new Error('SESSION_SECRET must be at least 32 characters in production.')
  }

  const app = express()
  app.disable('x-powered-by')
  if (production) app.set('trust proxy', 1)
  app.use(helmet())
  app.use(express.json({ limit: '20kb' }))
  app.use(session({
    name: 'creatorflow.sid',
    secret: sessionSecret || 'creatorflow-local-development-session-secret',
    store: new SQLiteSessionStore(db),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: production,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }))

  const requireCsrf = (req, res, next) => {
    const expected = req.session.csrfToken
    const supplied = req.get('x-csrf-token')
    if (!expected || !supplied || supplied.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
      return res.status(403).json({ error: 'Your session has expired. Refresh the page and try again.' })
    }
    next()
  }
  const requireUser = (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Please log in to continue.' })
    next()
  }

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
  app.get('/api/auth/csrf', (req, res) => {
    req.session.csrfToken ||= csrfToken()
    res.json({ csrfToken: req.session.csrfToken })
  })
  app.post('/api/auth/register', requireCsrf, asyncRoute(async (req, res) => {
    const data = validate(registrationSchema, req.body, res)
    if (!data) return
    const passwordHash = await bcrypt.hash(data.password, 12)
    let result
    try {
      result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
        .run(data.name, data.email, passwordHash)
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ error: 'An account with this email already exists.' })
      }
      throw error
    }
    await new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()))
    req.session.userId = Number(result.lastInsertRowid)
    req.session.csrfToken = csrfToken()
    res.status(201).json({ user: { id: Number(result.lastInsertRowid), name: data.name, email: data.email }, csrfToken: req.session.csrfToken })
  }))
  app.post('/api/auth/login', requireCsrf, asyncRoute(async (req, res) => {
    const data = validate(loginSchema, req.body, res)
    if (!data) return
    const user = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(data.email)
    const valid = user ? await bcrypt.compare(data.password, user.password_hash) : false
    if (!valid) return res.status(401).json({ error: 'Email or password is incorrect.' })
    await new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()))
    req.session.userId = user.id
    req.session.csrfToken = csrfToken()
    res.json({ user: publicUser(user), csrfToken: req.session.csrfToken })
  }))
  app.post('/api/auth/logout', requireCsrf, requireUser, (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error)
      res.clearCookie('creatorflow.sid', { httpOnly: true, sameSite: 'lax', secure: production })
      res.status(204).end()
    })
  })
  app.get('/api/auth/me', (req, res) => {
    if (!req.session.userId) return res.json({ user: null })
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.session.userId)
    if (!user) return res.json({ user: null })
    res.json({ user })
  })

  app.get('/api/profile', requireUser, (req, res) => {
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.session.userId)
    if (!user) return res.status(404).json({ error: 'Profile not found.' })
    res.json({ user })
  })
  app.put('/api/profile', requireCsrf, requireUser, (req, res) => {
    const data = validate(profileSchema, req.body, res)
    if (!data) return
    try {
      db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(data.name, data.email, req.session.userId)
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ error: 'An account with this email already exists.' })
      }
      throw error
    }
    res.json({ user: { id: req.session.userId, ...data } })
  })

  app.get('/api/posts', requireUser, (req, res) => {
    const posts = db.prepare(`
      SELECT id, title, body, platform, status, scheduled_at, created_at, updated_at
      FROM content_posts WHERE user_id = ? ORDER BY
        CASE WHEN status = 'Scheduled' THEN 0 ELSE 1 END,
        scheduled_at IS NULL, scheduled_at, updated_at DESC
    `).all(req.session.userId).map(postFromRow)
    res.json({ posts })
  })
  app.post('/api/posts', requireCsrf, requireUser, (req, res) => {
    const data = validate(contentSchema, req.body, res)
    if (!data) return
    const scheduledAt = data.status === 'Scheduled' ? new Date(data.scheduledAt).toISOString() : null
    const result = db.prepare(`
      INSERT INTO content_posts (user_id, title, body, platform, status, scheduled_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.session.userId, data.title, data.body, data.platform, data.status, scheduledAt)
    const post = db.prepare('SELECT * FROM content_posts WHERE id = ? AND user_id = ?').get(result.lastInsertRowid, req.session.userId)
    res.status(201).json({ post: postFromRow(post) })
  })
  app.put('/api/posts/:id', requireCsrf, requireUser, (req, res) => {
    const data = validate(contentSchema, req.body, res)
    if (!data) return
    const scheduledAt = data.status === 'Scheduled' ? new Date(data.scheduledAt).toISOString() : null
    const result = db.prepare(`
      UPDATE content_posts SET title = ?, body = ?, platform = ?, status = ?, scheduled_at = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(data.title, data.body, data.platform, data.status, scheduledAt, req.params.id, req.session.userId)
    if (!result.changes) return res.status(404).json({ error: 'Content not found.' })
    const post = db.prepare('SELECT * FROM content_posts WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId)
    res.json({ post: postFromRow(post) })
  })
  app.delete('/api/posts/:id', requireCsrf, requireUser, (req, res) => {
    const result = db.prepare('DELETE FROM content_posts WHERE id = ? AND user_id = ?').run(req.params.id, req.session.userId)
    if (!result.changes) return res.status(404).json({ error: 'Content not found.' })
    res.status(204).end()
  })

  app.get('/api/dashboard', requireUser, (req, res) => {
    const counts = db.prepare(`
      SELECT COUNT(*) AS total,
        SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) AS drafts,
        SUM(CASE WHEN status = 'Scheduled' THEN 1 ELSE 0 END) AS scheduled,
        SUM(CASE WHEN status = 'Published (demo)' THEN 1 ELSE 0 END) AS publishedDemo
      FROM content_posts WHERE user_id = ?
    `).get(req.session.userId)
    res.json({ counts: { total: counts.total, drafts: counts.drafts || 0, scheduled: counts.scheduled || 0, publishedDemo: counts.publishedDemo || 0 } })
  })

  app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found.' }))
  app.use((error, req, res, next) => {
    console.error(error)
    if (res.headersSent) return next(error)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  })
  return app
}
