import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import request from 'supertest'
import { createDatabase } from '../server/database.js'
import { createApp } from '../server/app.js'

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'creatorflow-test-'))
const db = createDatabase(path.join(tempDir, 'test.sqlite'))
const app = createApp({ db, sessionSecret: 'test-session-secret-that-is-long-enough-123', production: false })
const alice = request.agent(app)
const bob = request.agent(app)
let aliceCsrf
let bobCsrf
let alicePostId

async function csrf(agent) {
  const response = await agent.get('/api/auth/csrf').expect(200)
  return response.body.csrfToken
}

before(async () => {
  aliceCsrf = await csrf(alice)
  await alice.post('/api/auth/register').set('x-csrf-token', aliceCsrf).send({
    name: 'Alex Creator', email: 'alex@example.com', password: 'correct-horse-battery',
  }).expect(201)
  aliceCsrf = await csrf(alice)

  bobCsrf = await csrf(bob)
  await bob.post('/api/auth/register').set('x-csrf-token', bobCsrf).send({
    name: 'Taylor Creator', email: 'taylor@example.com', password: 'another-secure-password',
  }).expect(201)
  bobCsrf = await csrf(bob)
})

after(() => {
  db.close()
  rmSync(tempDir, { recursive: true, force: true })
})

test('stores only a password hash', () => {
  const user = db.prepare('SELECT password_hash FROM users WHERE email = ?').get('alex@example.com')
  assert.notEqual(user.password_hash, 'correct-horse-battery')
  assert.match(user.password_hash, /^\$2[aby]\$/)
})

test('rejects content writes without a CSRF token and invalid schedules', async () => {
  const payload = { title: 'Launch post', body: '', platform: 'Instagram', status: 'Draft' }
  await alice.post('/api/posts').send(payload).expect(403)
  await alice.post('/api/posts').set('x-csrf-token', aliceCsrf).send({
    ...payload, status: 'Scheduled', scheduledAt: null,
  }).expect(400)
})

test('creates content and calculates counts from saved records', async () => {
  const created = await alice.post('/api/posts').set('x-csrf-token', aliceCsrf).send({
    title: 'A thoughtful launch', body: 'A caption draft', platform: 'LinkedIn', status: 'Draft',
  }).expect(201)
  alicePostId = created.body.post.id
  const dashboard = await alice.get('/api/dashboard').expect(200)
  assert.deepEqual(dashboard.body.counts, { total: 1, drafts: 1, scheduled: 0, publishedDemo: 0 })
})

test('isolates content between accounts for reads, edits, and deletes', async () => {
  await bob.get('/api/posts').expect(200).expect(({ body }) => assert.equal(body.posts.length, 0))
  await bob.put(`/api/posts/${alicePostId}`).set('x-csrf-token', bobCsrf).send({
    title: 'Changed', body: '', platform: 'Other', status: 'Draft',
  }).expect(404)
  await bob.delete(`/api/posts/${alicePostId}`).set('x-csrf-token', bobCsrf).expect(404)
  await alice.get('/api/posts').expect(({ body }) => assert.equal(body.posts[0].title, 'A thoughtful launch'))
})

test('updates and deletes the owner content', async () => {
  await alice.put(`/api/posts/${alicePostId}`).set('x-csrf-token', aliceCsrf).send({
    title: 'Planned for Friday', body: 'A scheduled post', platform: 'YouTube', status: 'Scheduled',
    scheduledAt: '2030-06-15T10:30:00.000Z',
  }).expect(200)
  const counts = await alice.get('/api/dashboard').expect(200)
  assert.equal(counts.body.counts.scheduled, 1)
  await alice.delete(`/api/posts/${alicePostId}`).set('x-csrf-token', aliceCsrf).expect(204)
  const empty = await alice.get('/api/dashboard').expect(200)
  assert.equal(empty.body.counts.total, 0)
})
