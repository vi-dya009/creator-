import session from 'express-session'

export class SQLiteSessionStore extends session.Store {
  constructor(db) {
    super()
    this.db = db
    this.read = db.prepare('SELECT sess FROM sessions WHERE sid = ? AND expire > ?')
    this.write = db.prepare(`
      INSERT INTO sessions (sid, sess, expire) VALUES (?, ?, ?)
      ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expire = excluded.expire
    `)
    this.remove = db.prepare('DELETE FROM sessions WHERE sid = ?')
    this.refresh = db.prepare('UPDATE sessions SET expire = ? WHERE sid = ?')
    this.deleteExpired = db.prepare('DELETE FROM sessions WHERE expire <= ?')
  }

  get(sid, callback) {
    try {
      const row = this.read.get(sid, Date.now())
      callback(null, row ? JSON.parse(row.sess) : null)
    } catch (error) {
      callback(error)
    }
  }

  set(sid, sess, callback = () => {}) {
    try {
      const expires = sess.cookie?.expires
        ? new Date(sess.cookie.expires).getTime()
        : Date.now() + 24 * 60 * 60 * 1000
      this.write.run(sid, JSON.stringify(sess), expires)
      this.deleteExpired.run(Date.now())
      callback(null)
    } catch (error) {
      callback(error)
    }
  }

  destroy(sid, callback = () => {}) {
    try {
      this.remove.run(sid)
      callback(null)
    } catch (error) {
      callback(error)
    }
  }

  touch(sid, sess, callback = () => {}) {
    try {
      const expires = sess.cookie?.expires
        ? new Date(sess.cookie.expires).getTime()
        : Date.now() + 24 * 60 * 60 * 1000
      this.refresh.run(expires, sid)
      callback(null)
    } catch (error) {
      callback(error)
    }
  }
}
