import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownToLine, ArrowRight, ArrowUpRight, BarChart3, CalendarDays, Check,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3,
  Command, FileText, LayoutDashboard, LogOut, Menu,
  MoreHorizontal, Plus, Search, Settings2, Sparkles, X, Pencil, Trash2,
  TrendingUp, WandSparkles,
} from 'lucide-react'
import './App.css'

const platforms = ['YouTube', 'Instagram', 'LinkedIn', 'Other']
const statuses = ['Idea', 'Draft', 'Ready', 'Scheduled', 'Published (demo)', 'Cancelled']
const navItems = [
  { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'Content', label: 'Content', icon: FileText },
  { id: 'Calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'Analytics', label: 'Analytics', icon: BarChart3 },
]
const demoMetrics = [
  { label: 'Week 1', value: 36 },
  { label: 'Week 2', value: 52 },
  { label: 'Week 3', value: 45 },
  { label: 'Week 4', value: 72 },
  { label: 'Week 5', value: 61 },
  { label: 'Week 6', value: 88 },
  { label: 'Week 7', value: 74 },
]

const isStaticDemo = import.meta.env.VITE_DEMO_MODE === 'true'
let csrfToken = ''

function makeDemoPosts() {
  const now = new Date()
  const scheduledDate = (days, hour) => {
    const date = new Date(now)
    date.setDate(date.getDate() + days)
    date.setHours(hour, 30, 0, 0)
    return date.toISOString()
  }
  return [
    { id: 'demo-1', title: 'A little behind the scenes', body: 'A few quiet moments from the making of something new.', platform: 'Instagram', status: 'Scheduled', scheduledAt: scheduledDate(2, 14), createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'demo-2', title: 'What I learned building in public', body: 'The unexpected parts of showing up before everything is polished.', platform: 'LinkedIn', status: 'Draft', scheduledAt: null, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'demo-3', title: 'A quieter kind of productivity', body: 'A short video about making creative space without the pressure.', platform: 'YouTube', status: 'Ready', scheduledAt: null, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'demo-4', title: 'Small things worth remembering', body: 'A collection of little ideas for a slower Monday.', platform: 'Other', status: 'Idea', scheduledAt: null, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'demo-5', title: 'A note on making things slowly', body: 'One example of a post marked published in the demo. It was not actually published.', platform: 'Instagram', status: 'Published (demo)', scheduledAt: null, createdAt: now.toISOString(), updatedAt: now.toISOString() },
  ]
}

async function api(path, options = {}) {
  const method = options.method || 'GET'
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers['X-CSRF-Token'] = csrfToken
  const response = await fetch(`/api${path}`, {
    ...options,
    method,
    headers,
    credentials: 'same-origin',
  })
  if (response.status === 204) return null
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'Something went wrong. Please try again.')
  return payload
}

function IconPlatform({ platform, size = 15 }) {
  const glyph = platform === 'YouTube' ? 'YT' : platform === 'Instagram' ? 'IG' : platform === 'LinkedIn' ? 'in' : '•'
  return <span className="platform-glyph" style={{ fontSize: size * 0.63 }} aria-hidden="true">{glyph}</span>
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDate(value, options = { month: 'short', day: 'numeric' }) {
  if (!value) return 'No date set'
  return new Intl.DateTimeFormat(undefined, options).format(new Date(value))
}

function localDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function StatusBadge({ status }) {
  const className = status === 'Scheduled' ? 'badge badge-violet'
    : status === 'Published (demo)' ? 'badge badge-green'
      : status === 'Ready' ? 'badge badge-blue'
        : status === 'Cancelled' ? 'badge badge-muted' : 'badge badge-neutral'
  return <span className={className}>{status === 'Published (demo)' && <Check size={12} />}{status}</span>
}

function Brand({ small = false }) {
  return <span className={`brand-mark ${small ? 'brand-mark-small' : ''}`} aria-hidden="true"><Sparkles size={small ? 15 : 17} /></span>
}

function Landing({ onAuth, staticDemo = false }) {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <a className="brand" href="#" aria-label="CreatorFlow home"><Brand /> creatorflow</a>
        <div className="landing-nav-actions">
          {!staticDemo && <button className="text-button" onClick={() => onAuth('login')}>Log in</button>}
          <button className="button button-dark button-small" onClick={() => onAuth(staticDemo ? 'demo' : 'register')}>{staticDemo ? 'Explore the demo' : 'Get started'} <ArrowRight size={15} /></button>
        </div>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR IDEAS, IN MOTION</div>
          <h1>Make space for<br /><span>your next big idea.</span></h1>
          <p className="hero-description">A calmer way to plan, create, and keep your content moving. Everything you need, right where you need it.</p>
          <div className="hero-actions">
            <button className="button button-dark" onClick={() => onAuth(staticDemo ? 'demo' : 'register')}>{staticDemo ? 'Explore the interactive demo' : 'Start planning for free'} <ArrowRight size={16} /></button>
            {!staticDemo && <button className="button button-quiet" onClick={() => onAuth('login')}>I already have an account</button>}
          </div>
          <div className="hero-proof"><div className="avatar-stack"><span>J</span><span>M</span><span>A</span></div><span>Made for creators who do it all.</span></div>
        </div>
        <div className="hero-art" aria-label="A preview of the CreatorFlow content planning dashboard">
          <div className="floating-note note-one"><span className="note-icon note-lilac"><CalendarDays size={15} /></span><span><b>Plan ahead</b><small>Your week, at a glance</small></span></div>
          <div className="floating-note note-two"><span className="note-icon note-peach"><Sparkles size={15} /></span><span><b>Keep the flow</b><small>One idea at a time</small></span></div>
          <div className="preview-window">
            <div className="preview-top"><div className="preview-brand"><Brand small /> creatorflow</div><div className="preview-dots"><i /><i /><i /></div></div>
            <div className="preview-content">
              <div className="preview-greeting"><span>MONDAY, OCTOBER 12</span><strong>Your content, <em>in motion.</em></strong><small>A little progress adds up.</small></div>
              <div className="preview-stats">
                <div><span>In the works</span><b>08</b><small><span className="tiny-dot dot-violet" /> 3 drafts this week</small></div>
                <div><span>Coming up</span><b>04</b><small><span className="tiny-dot dot-green" /> You're on track</small></div>
              </div>
              <div className="preview-section-head"><b>On your calendar</b><span>THIS WEEK</span></div>
              <div className="preview-post"><span className="preview-platform ig"><IconPlatform platform="Instagram" size={14} /></span><span><b>A little behind the scenes</b><small>Instagram · Today, 2:30 PM</small></span><span className="preview-post-status">Planned</span></div>
              <div className="preview-post"><span className="preview-platform li"><IconPlatform platform="LinkedIn" size={14} /></span><span><b>What I learned building in public</b><small>LinkedIn · Wednesday</small></span><span className="preview-post-status">Draft</span></div>
              <div className="preview-post"><span className="preview-platform yt"><IconPlatform platform="YouTube" size={14} /></span><span><b>A quieter kind of productivity</b><small>YouTube · Friday</small></span><span className="preview-post-status">Draft</span></div>
            </div>
          </div>
          <div className="hero-sunburst" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>
        </div>
      </section>
      <section className="feature-strip">
        <div className="strip-intro"><span>LESS SPINNING.</span><b>More making.</b></div>
        <div className="strip-feature"><span className="feature-icon violet"><FileText size={17} /></span><span><b>Ideas have a home</b><small>Catch every good one.</small></span></div>
        <div className="strip-feature"><span className="feature-icon peach"><CalendarDays size={17} /></span><span><b>A plan that feels good</b><small>See what's coming up.</small></span></div>
        <div className="strip-feature"><span className="feature-icon green"><TrendingUp size={17} /></span><span><b>Progress, not pressure</b><small>Notice the little wins.</small></span></div>
      </section>
      <footer className="landing-footer"><span><Brand small /> CreatorFlow</span><span>A little more flow in your creative work.</span><span>{staticDemo ? 'Static portfolio preview · Sample data only' : 'Demo product · No posts are published'}</span></footer>
    </main>
  )
}

function AuthScreen({ mode, setMode, onBack, onSubmit, error, busy }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <main className="auth-page">
      <button className="brand auth-brand" onClick={onBack}><Brand /> creatorflow</button>
      <section className="auth-card">
        <span className="auth-icon"><Sparkles size={20} /></span>
        <p className="eyebrow">{mode === 'register' ? 'A FRESH START' : 'WELCOME BACK'}</p>
        <h1>{mode === 'register' ? 'Make room for ideas.' : 'Good to see you.'}</h1>
        <p className="auth-subtitle">{mode === 'register' ? 'Your creative space is just a few details away.' : 'Pick up right where your ideas left off.'}</p>
        <form onSubmit={(event) => { event.preventDefault(); onSubmit({ name, email, password }) }}>
          {mode === 'register' && <label>Your name<input autoComplete="name" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Sam Creator" /></label>}
          <label>Email address<input autoComplete="email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input autoComplete={mode === 'register' ? 'new-password' : 'current-password'} type="password" required minLength={mode === 'register' ? 8 : 1} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark auth-submit" disabled={busy}>{busy ? 'Just a moment…' : mode === 'register' ? 'Create your account' : 'Log in'} <ArrowRight size={16} /></button>
        </form>
        <p className="auth-switch">{mode === 'register' ? 'Already have a space?' : 'New around here?'} <button onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>{mode === 'register' ? 'Log in' : 'Create an account'}</button></p>
      </section>
      <p className="auth-footnote"><CheckCircle2 size={14} /> Your drafts are private and only visible to you.</p>
    </main>
  )
}

function PostCard({ post, onEdit, onDelete, compact = false, readOnly = false }) {
  return (
    <article className={`post-card ${compact ? 'post-card-compact' : ''}`}>
      <span className={`platform-icon platform-${post.platform.toLowerCase()}`}><IconPlatform platform={post.platform} /></span>
      <div className="post-card-main">
        <div className="post-title-row"><h3>{post.title}</h3><StatusBadge status={post.status} /></div>
        {post.body && <p>{post.body}</p>}
        <div className="post-meta"><span><IconPlatform platform={post.platform} size={13} /> {post.platform}</span><span>{post.scheduledAt ? <><Clock3 size={13} /> {formatDate(post.scheduledAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</> : <><Clock3 size={13} /> Updated {formatDate(post.updatedAt)}</>}</span></div>
      </div>
      {!readOnly && <div className="post-actions"><button className="icon-button" aria-label={`Edit ${post.title}`} onClick={() => onEdit(post)}><Pencil size={15} /></button><button className="icon-button danger-hover" aria-label={`Delete ${post.title}`} onClick={() => onDelete(post)}><Trash2 size={15} /></button></div>}
    </article>
  )
}

function PostModal({ post, initialDate, onClose, onSave, busy }) {
  const [title, setTitle] = useState(post?.title || '')
  const [body, setBody] = useState(post?.body || '')
  const [platform, setPlatform] = useState(post?.platform || 'Instagram')
  const [status, setStatus] = useState(post?.status || (initialDate ? 'Scheduled' : 'Draft'))
  const [scheduledAt, setScheduledAt] = useState(localDateTime(post?.scheduledAt) || initialDate || '')
  const [error, setError] = useState('')
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="post-modal-title">
        <div className="modal-head"><div><span className="eyebrow">{post ? 'MAKE IT YOURS' : 'NEW CONTENT'}</span><h2 id="post-modal-title">{post ? 'Edit your content' : 'Capture an idea'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div>
        <form onSubmit={async (event) => {
          event.preventDefault()
          setError('')
          try {
            await onSave({ title, body, platform, status, scheduledAt: status === 'Scheduled' ? new Date(scheduledAt).toISOString() : null })
          } catch (saveError) { setError(saveError.message) }
        }}>
          <label>Title <span className="field-required">Required</span><input autoFocus required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give this idea a name" /></label>
          <label>Caption or notes<textarea maxLength={5000} rows={4} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Start with a rough thought. You can polish it later." /><span className="field-hint">{body.length}/5,000 characters</span></label>
          <div className="form-grid">
            <label>Platform<select value={platform} onChange={(event) => setPlatform(event.target.value)}>{platforms.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          {status === 'Scheduled' && <label>Planned date &amp; time<input type="datetime-local" required value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /><span className="field-hint">This is a planning demo. Nothing will be published.</span></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-dark" disabled={busy}>{busy ? 'Saving…' : post ? 'Save changes' : 'Save content'} <Check size={15} /></button></div>
        </form>
      </section>
    </div>
  )
}

function CalendarView({ posts, onNew, onEdit, onDelete, readOnly = false }) {
  const [today] = useState(() => new Date())
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(() => dateKey(today))
  const startDay = (month.getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const days = Array.from({ length: startDay + daysInMonth }, (_, index) => index < startDay ? null : index - startDay + 1)
  const scheduled = posts.filter((post) => post.status === 'Scheduled' && post.scheduledAt)
  const postsByDate = useMemo(() => {
    const grouped = new Map()
    scheduled.forEach((post) => {
      const key = dateKey(new Date(post.scheduledAt))
      grouped.set(key, [...(grouped.get(key) || []), post])
    })
    return grouped
  }, [scheduled])
  const selectedPosts = postsByDate.get(selectedDay) || []
  const keyForDay = (day) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return (
    <div className="calendar-layout">
      <section className="panel calendar-panel">
        <div className="calendar-toolbar"><div><h2>{formatDate(month, { month: 'long', year: 'numeric' })}</h2><p>Your content, at your own pace.</p></div><div className="calendar-controls"><button className="icon-button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18} /></button><button className="button button-outline button-small" onClick={() => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(dateKey(today)) }}>Today</button><button className="icon-button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} /></button></div></div>
        <div className="calendar-grid calendar-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="calendar-grid">{days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} className="calendar-day calendar-empty" />
          const key = keyForDay(day)
          const hasPosts = postsByDate.get(key) || []
          const isToday = key === dateKey(today)
          return <button key={key} className={`calendar-day ${isToday ? 'calendar-today' : ''} ${selectedDay === key ? 'calendar-selected' : ''}`} onClick={() => setSelectedDay(key)} aria-label={`${formatDate(new Date(`${key}T12:00:00`), { month: 'long', day: 'numeric' })}${hasPosts.length ? `, ${hasPosts.length} scheduled post${hasPosts.length === 1 ? '' : 's'}` : ''}`}>
            <span className="calendar-day-number">{day}</span>
            {hasPosts.slice(0, 2).map((post) => <span className={`calendar-event event-${post.platform.toLowerCase()}`} key={post.id}><span className="calendar-event-dot" />{post.title}</span>)}
            {hasPosts.length > 2 && <small className="calendar-more">+{hasPosts.length - 2} more</small>}
          </button>
        })}</div>
      </section>
      <aside className="panel day-agenda">
        <div className="agenda-head"><div><span className="eyebrow">YOUR PLAN</span><h2>{formatDate(new Date(`${selectedDay}T12:00:00`), { weekday: 'long', month: 'long', day: 'numeric' })}</h2></div>{!readOnly && <button className="icon-button" aria-label="Add content for this day" onClick={() => onNew(`${selectedDay}T09:00`)}><Plus size={18} /></button>}</div>
        {selectedPosts.length ? <div className="agenda-posts">{selectedPosts.map((post) => <PostCard key={post.id} post={post} onEdit={onEdit} onDelete={onDelete} compact readOnly={readOnly} />)}</div> : <div className="agenda-empty"><span className="empty-icon"><CalendarDays size={21} /></span><b>A little breathing room.</b><p>{readOnly ? 'This day is open in the sample calendar.' : 'Nothing planned for this day yet.'}</p>{!readOnly && <button className="text-button" onClick={() => onNew(`${selectedDay}T09:00`)}>Add something <ArrowRight size={14} /></button>}</div>}
        <p className="demo-note"><CircleHelp size={14} /> Scheduling here is a demo. Posts are never published.</p>
      </aside>
    </div>
  )
}

function App() {
  const [today] = useState(() => new Date())
  const [staticLanding, setStaticLanding] = useState(isStaticDemo)
  const [user, setUser] = useState(() => isStaticDemo ? { id: 'demo', name: 'Demo Creator', email: 'portfolio-preview' } : null)
  const [authMode, setAuthMode] = useState(null)
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [initializing, setInitializing] = useState(!isStaticDemo)
  const [pageError, setPageError] = useState('')
  const [posts, setPosts] = useState(() => isStaticDemo ? makeDemoPosts() : [])
  const [counts, setCounts] = useState(() => isStaticDemo
    ? { total: 5, drafts: 1, scheduled: 1, publishedDemo: 1 }
    : { total: 0, drafts: 0, scheduled: 0, publishedDemo: 0 })
  const [activePage, setActivePage] = useState('Overview')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All status')
  const [platformFilter, setPlatformFilter] = useState('All platforms')
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileName, setProfileName] = useState(() => isStaticDemo ? 'Demo Creator' : '')
  const [profileEmail, setProfileEmail] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const searchRef = useRef(null)

  const loadWorkspace = useCallback(async () => {
    const [postsPayload, dashboardPayload] = await Promise.all([api('/posts'), api('/dashboard')])
    setPosts(postsPayload.posts)
    setCounts(dashboardPayload.counts)
  }, [])

  useEffect(() => {
    if (isStaticDemo) return undefined
    let mounted = true
    Promise.all([
      fetch('/api/auth/csrf', { credentials: 'same-origin' }).then(async (response) => {
        if (!response.ok) throw new Error('Could not connect to the app server. Start CreatorFlow with npm run dev.')
        const payload = await response.json()
        csrfToken = payload.csrfToken
      }),
      fetch('/api/auth/me', { credentials: 'same-origin' }).then((response) => response.json()),
    ]).then(async ([, payload]) => {
      if (!mounted) return
      if (payload.user) {
        setUser(payload.user)
        setProfileName(payload.user.name)
        setProfileEmail(payload.user.email)
        const [postsPayload, dashboardPayload] = await Promise.all([api('/posts'), api('/dashboard')])
        if (!mounted) return
        setPosts(postsPayload.posts)
        setCounts(dashboardPayload.counts)
      }
    }).catch((error) => { if (mounted) setPageError(error.message) })
      .finally(() => { if (mounted) setInitializing(false) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (activePage === 'Content') searchRef.current?.focus()
  }, [activePage])

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setActivePage('Content')
        setTimeout(() => searchRef.current?.focus(), 0)
      }
      if (!event.metaKey && !event.ctrlKey && event.key.toLowerCase() === 'n' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) && user && !isStaticDemo) {
        event.preventDefault()
        setModal({ post: null })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [user])

  const showError = (error) => setPageError(error.message || 'Something went wrong. Please try again.')
  const openAuth = (mode) => { setAuthError(''); setAuthMode(mode) }
  const submitAuth = async (data) => {
    if (isStaticDemo) return
    setAuthBusy(true)
    setAuthError('')
    try {
      const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login'
      const result = await api(endpoint, { method: 'POST', body: JSON.stringify(data) })
      csrfToken = result.csrfToken
      setUser(result.user)
      setProfileName(result.user.name)
      setProfileEmail(result.user.email)
      setAuthMode(null)
      setActivePage('Overview')
      await loadWorkspace()
    } catch (error) { setAuthError(error.message) } finally { setAuthBusy(false) }
  }

  const savePost = async (data) => {
    setSaving(true)
    try {
      const result = await api(modal.post ? `/posts/${modal.post.id}` : '/posts', {
        method: modal.post ? 'PUT' : 'POST',
        body: JSON.stringify(data),
      })
      await loadWorkspace()
      setModal(null)
      return result
    } finally { setSaving(false) }
  }

  const deletePost = async (post) => {
    if (isStaticDemo) return
    if (!window.confirm(`Delete “${post.title}”? This can't be undone.`)) return
    try {
      await api(`/posts/${post.id}`, { method: 'DELETE' })
      await loadWorkspace()
    } catch (error) { showError(error) }
  }

  const signOut = async () => {
    if (isStaticDemo) {
      setStaticLanding(true)
      return
    }
    try {
      await api('/auth/logout', { method: 'POST' })
      csrfToken = ''
      setUser(null)
      setPosts([])
      setCounts({ total: 0, drafts: 0, scheduled: 0, publishedDemo: 0 })
      setActivePage('Overview')
      setMenuOpen(false)
      setPageError('')
      const payload = await api('/auth/csrf')
      csrfToken = payload.csrfToken
    } catch (error) { showError(error) }
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    if (isStaticDemo) {
      setProfileMessage('Profile editing is disabled in this static preview.')
      return
    }
    setProfileMessage('')
    try {
      const result = await api('/profile', { method: 'PUT', body: JSON.stringify({ name: profileName, email: profileEmail }) })
      setUser(result.user)
      setProfileMessage('Your profile is up to date.')
    } catch (error) { showError(error) }
  }

  const filteredPosts = useMemo(() => posts.filter((post) => {
    const matchesSearch = `${post.title} ${post.body} ${post.platform}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All status' || post.status === statusFilter
    const matchesPlatform = platformFilter === 'All platforms' || post.platform === platformFilter
    return matchesSearch && matchesStatus && matchesPlatform
  }), [posts, search, statusFilter, platformFilter])

  const exportCsv = () => {
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const csv = [
      ['Title', 'Caption', 'Platform', 'Status', 'Planned date'],
      ...posts.map((post) => [post.title, post.body, post.platform, post.status, post.scheduledAt || '']),
    ].map((row) => row.map(escape).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'creatorflow-content.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isStaticDemo && staticLanding && !authMode && user?.id === 'demo') {
    return <Landing staticDemo onAuth={() => { setActivePage('Overview'); setStaticLanding(false) }} />
  }

  const showingDemo = isStaticDemo

  if (initializing) return <div className="loading-screen"><Brand /><span>Making a little space…</span></div>
  if (!user && authMode) return <AuthScreen mode={authMode} setMode={setAuthMode} onBack={() => setAuthMode(null)} onSubmit={submitAuth} error={authError} busy={authBusy} />
  if (!user) return <><Landing onAuth={openAuth} />{pageError && <div className="connection-banner" role="alert">{pageError}</div>}</>

  const pageTitles = {
    Overview: ['Your content,', 'in motion.'],
    Content: ['Your creative', 'backlog.'],
    Calendar: ['A little space', 'to plan ahead.'],
    Analytics: ['Notice your', 'own momentum.'],
  }
  const pageTitle = pageTitles[activePage] || pageTitles.Overview
  const upcoming = posts.filter((post) => post.status === 'Scheduled' && post.scheduledAt && new Date(post.scheduledAt) >= today)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)).slice(0, 3)

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <button className="brand sidebar-brand" onClick={() => setActivePage('Overview')}><Brand /> creatorflow</button>
        <div className="workspace-switcher"><span className="workspace-avatar">{user.name.trim().slice(0, 1).toUpperCase()}</span><span><b>{user.name}'s space</b><small>Personal workspace</small></span><ChevronDown size={15} /></div>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${activePage === id ? 'nav-item-active' : ''}`} onClick={() => { setActivePage(id); setMenuOpen(false) }}><Icon size={18} /><span>{label}</span>{id === 'Content' && counts.total > 0 && <span className="nav-count">{counts.total}</span>}</button>)}
        </nav>
        <div className="side-bottom">
          <button className={`nav-item ${activePage === 'Settings' ? 'nav-item-active' : ''}`} onClick={() => { setActivePage('Settings'); setMenuOpen(false) }}><Settings2 size={18} /><span>Settings</span></button>
          <div className="sidebar-tip"><span className="tip-icon"><WandSparkles size={16} /></span><b>Keep the ideas coming.</b><p>A good plan makes room for the unexpected.</p></div>
          <button className="user-menu" onClick={() => setMenuOpen(!menuOpen)}><span className="user-avatar">{user.name.trim().slice(0, 1).toUpperCase()}</span><span><b>{user.name}</b><small>{user.email}</small></span><MoreHorizontal size={18} /></button>
          {menuOpen && <div className="profile-menu"><button onClick={() => { setActivePage('Settings'); setMenuOpen(false) }}><Settings2 size={15} /> Profile settings</button><button onClick={signOut}><LogOut size={15} /> Log out</button></div>}
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar"><button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}><Menu size={19} /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><b>{activePage}</b></div><div className="topbar-right"><button className="top-search" onClick={() => { setActivePage('Content'); setTimeout(() => searchRef.current?.focus(), 0) }}><Search size={15} /><span>Search content</span><kbd><Command size={11} /> K</kbd></button><span className="topbar-date">{formatDate(today, { weekday: 'short', month: 'short', day: 'numeric' })}</span><button className="user-avatar top-avatar" aria-label="Open profile settings" onClick={() => setActivePage('Settings')}>{user.name.trim().slice(0, 1).toUpperCase()}</button></div></header>
        <div className="page-content">
          {showingDemo && <div className="static-demo-banner"><Sparkles size={15} /><span><b>Interactive portfolio preview</b> · Sample content only. Sign-in, saving, and publishing are not connected.</span><button className="text-button" onClick={() => setStaticLanding(true)}>Back to home <ArrowRight size={13} /></button></div>}
          {pageError && <div className="notice-error" role="alert"><span>{pageError}</span><button className="icon-button" onClick={() => setPageError('')} aria-label="Dismiss"><X size={15} /></button></div>}
          <section className="page-heading"><div><p className="eyebrow">{activePage === 'Overview' ? `YOUR SPACE · ${formatDate(today, { month: 'long', year: 'numeric' }).toUpperCase()}` : `YOUR SPACE · ${activePage.toUpperCase()}`}</p><h1>{pageTitle[0]}<br /><span>{pageTitle[1]}</span></h1></div>{activePage !== 'Settings' && !showingDemo && <button className="button button-dark" onClick={() => setModal({ post: null })}><Plus size={17} /> New content</button>}</section>

          {activePage === 'Overview' && <>
            <section className="stats-grid" aria-label="Content summary">
              <div className="stat-card stat-total"><div className="stat-top"><span>All content</span><span className="stat-icon"><FileText size={16} /></span></div><strong>{String(counts.total).padStart(2, '0')}</strong><small>Your ideas, all together</small></div>
              <div className="stat-card"><div className="stat-top"><span>In progress</span><span className="stat-icon stat-icon-lilac"><Pencil size={16} /></span></div><strong>{String(counts.drafts).padStart(2, '0')}</strong><small>Drafts taking shape</small></div>
              <div className="stat-card"><div className="stat-top"><span>Coming up</span><span className="stat-icon stat-icon-peach"><CalendarDays size={16} /></span></div><strong>{String(counts.scheduled).padStart(2, '0')}</strong><small>Planned to go out</small></div>
              <div className="stat-card"><div className="stat-top"><span>Published demo</span><span className="stat-icon stat-icon-green"><CheckCircle2 size={16} /></span></div><strong>{String(counts.publishedDemo).padStart(2, '0')}</strong><small>Marked as demo only</small></div>
            </section>
            <section className="overview-grid">
              <div className="panel upcoming-panel"><div className="panel-heading"><div><span className="eyebrow">ON THE HORIZON</span><h2>Coming up</h2></div><button className="text-button" onClick={() => setActivePage('Calendar')}>Open calendar <ArrowUpRight size={14} /></button></div>
                {upcoming.length ? <div className="upcoming-list">{upcoming.map((post) => <PostCard key={post.id} post={post} onEdit={(item) => setModal({ post: item })} onDelete={deletePost} compact readOnly={showingDemo} />)}</div> : <div className="empty-state"><span className="empty-icon"><CalendarDays size={22} /></span><b>Your calendar has room to grow.</b><p>Schedule a post and it'll show up right here.</p>{!showingDemo && <button className="button button-outline button-small" onClick={() => setModal({ post: null })}><Plus size={14} /> Plan a post</button>}</div>}
              </div>
              <div className="panel rhythm-panel"><div className="panel-heading"><div><span className="eyebrow">A GENTLE REMINDER</span><h2>Keep your rhythm</h2></div><span className="sparkle-circle"><Sparkles size={16} /></span></div><p className="rhythm-copy">A little consistency goes a long way. Give one of those ideas a first draft today.</p><div className="rhythm-progress"><span><span className="tiny-dot dot-violet" /> Your ideas</span><b>{counts.total} {showingDemo ? 'sample ideas' : 'saved'}</b></div><div className="progress-track"><span style={{ width: `${Math.min(100, counts.total * 12)}%` }} /></div>{showingDemo ? <span className="demo-readonly-note">Example content for this preview.</span> : <button className="button button-outline rhythm-button" onClick={() => setModal({ post: null })}><Plus size={15} /> Capture an idea</button>}</div>
            </section>
            <section className="panel demo-analytics-panel"><div className="panel-heading"><div><span className="eyebrow">A LITTLE PERSPECTIVE</span><h2>Your creative rhythm</h2></div><span className="demo-label"><span className="tiny-dot dot-amber" /> Demo data</span></div><div className="mini-chart" aria-label="Sample demo activity chart showing seven weeks"><div className="mini-chart-bars">{demoMetrics.map((item) => <div className="mini-bar-wrap" key={item.label}><div className="mini-bar" style={{ height: `${item.value}%` }} /><span>{item.label.replace('Week ', 'W')}</span></div>)}</div><div className="mini-chart-label"><span>Example activity · This is sample data, not real platform analytics.</span><button className="text-button" onClick={() => setActivePage('Analytics')}>See demo analytics <ArrowRight size={14} /></button></div></div></section>
          </>}

          {activePage === 'Content' && <section className="panel content-panel"><div className="content-toolbar"><div><h2>All your ideas</h2><p>{showingDemo ? 'Example posts in the interactive portfolio preview.' : 'Every draft, plan, and maybe-someday.'}</p></div><div className="toolbar-actions"><button className="button button-outline button-small" onClick={exportCsv}><ArrowDownToLine size={14} /> Export CSV</button></div></div><div className="filters-row"><label className="content-search"><Search size={16} /><input ref={searchRef} placeholder="Find an idea..." value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search content" /></label><select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All status</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select><select aria-label="Filter by platform" value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}><option>All platforms</option>{platforms.map((platform) => <option key={platform}>{platform}</option>)}</select></div>
            {filteredPosts.length ? <div className="content-list">{filteredPosts.map((post) => <PostCard key={post.id} post={post} onEdit={(item) => setModal({ post: item })} onDelete={deletePost} readOnly={showingDemo} />)}</div> : <div className="empty-state content-empty"><span className="empty-icon"><Search size={21} /></span><b>{posts.length ? 'Nothing matches that search.' : 'Your first idea starts here.'}</b><p>{posts.length ? 'Try a different phrase or clear a filter.' : 'Save a rough thought. There is no need to have it all figured out.'}</p>{posts.length ? <button className="text-button" onClick={() => { setSearch(''); setStatusFilter('All status'); setPlatformFilter('All platforms') }}>Clear filters <X size={14} /></button> : <button className="button button-dark button-small" onClick={() => setModal({ post: null })}><Plus size={15} /> Capture an idea</button>}</div>}
            <div className="content-foot">{filteredPosts.length} {filteredPosts.length === 1 ? 'item' : 'items'}{search || statusFilter !== 'All status' || platformFilter !== 'All platforms' ? ' found' : showingDemo ? ' in this sample preview' : ' in your space'}<span><Command size={12} /> K to search · {showingDemo ? 'Read-only preview' : 'N for new content'}</span></div>
          </section>}

          {activePage === 'Calendar' && <CalendarView posts={posts} onNew={(initialDate) => setModal({ post: null, initialDate })} onEdit={(post) => setModal({ post })} onDelete={deletePost} readOnly={showingDemo} />}

          {activePage === 'Analytics' && <section className="analytics-view"><div className="analytics-demo-banner"><span className="demo-banner-icon"><TrendingUp size={19} /></span><div><b>These numbers are just for demonstration.</b><p>CreatorFlow isn't connected to your social accounts. This sample data isn't a measure of real performance.</p></div><span className="demo-label"><span className="tiny-dot dot-amber" /> Demo data</span></div><div className="analytics-stat-grid"><div className="stat-card"><span className="eyebrow">SAMPLE REACH</span><strong>12.8k</strong><small>Illustrative impressions</small></div><div className="stat-card"><span className="eyebrow">SAMPLE ENGAGEMENT</span><strong>4.6%</strong><small>Illustrative engagement rate</small></div><div className="stat-card"><span className="eyebrow">POSTS PLANNED</span><strong>{String(counts.scheduled).padStart(2, '0')}</strong><small>{showingDemo ? 'Sample posts in this preview' : 'Count from your saved content'}</small></div></div><section className="panel analytics-chart-panel"><div className="panel-heading"><div><span className="eyebrow">SAMPLE ACTIVITY</span><h2>A made-up month, just for the demo</h2></div><span className="demo-label"><span className="tiny-dot dot-amber" /> Demo data</span></div><div className="chart-y-labels"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div className="analytics-chart"><div className="chart-gridlines"><i /><i /><i /><i /><i /></div><div className="chart-bars">{demoMetrics.map((item) => <div className="chart-bar-group" key={item.label}><div className="chart-bar" style={{ height: `${item.value}%` }} title={`${item.label}: sample value ${item.value}`} /><span>{item.label}</span></div>)}</div></div><p className="chart-footnote"><CircleHelp size={14} /> Sample values are illustrative only and do not come from a social platform.</p></section><div className="analytics-bottom-note"><Sparkles size={16} /><span><b>Your real progress starts with the plan.</b> Keep creating, and use your own platform analytics to understand what resonates.</span></div></section>}

          {activePage === 'Settings' && <section className="panel settings-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR SPACE</span><h2>Profile settings</h2><p>{showingDemo ? 'This static portfolio preview does not use real accounts.' : 'Just the basics. Your details stay private to your account.'}</p></div></div><form className="settings-form" onSubmit={saveProfile}><label>Your name<input autoComplete="name" required minLength={2} maxLength={80} value={profileName} onChange={(event) => setProfileName(event.target.value)} /></label>{!showingDemo && <label>Email address<input autoComplete="email" type="email" required maxLength={254} value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} /></label>}{profileMessage && <p className="form-success" role="status"><CheckCircle2 size={15} /> {profileMessage}</p>}<div className="settings-actions">{!showingDemo && <button className="button button-dark">Save changes <Check size={15} /></button>}<button type="button" className="button button-outline" onClick={signOut}>{showingDemo ? <ArrowRight size={15} /> : <LogOut size={15} />} {showingDemo ? 'Back to landing page' : 'Log out'}</button></div></form><div className="settings-divider" /><div className="privacy-reminder"><span className="privacy-icon"><CheckCircle2 size={17} /></span><span><b>{showingDemo ? 'Sample data only.' : 'Your content belongs to you.'}</b><small>{showingDemo ? 'The public portfolio preview is read-only; no account or data is saved.' : 'Only you can see the ideas and drafts in this workspace.'}</small></span></div></section>}

          <footer className="app-footer"><span>Made for a more thoughtful kind of creating <span className="footer-heart">✳</span></span><span>CreatorFlow · Demo planner only</span></footer>
        </div>
      </main>
      {menuOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      {modal && <PostModal key={modal.post?.id || 'new'} post={modal.post} initialDate={modal.initialDate} onClose={() => setModal(null)} onSave={savePost} busy={saving} />}
    </div>
  )
}

export default App
