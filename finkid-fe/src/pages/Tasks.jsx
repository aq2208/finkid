import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  PiClipboardTextFill,
  PiLightningFill,
  PiHourglassHighFill,
  PiCheckCircleFill,
  PiHandFill,
  PiTrashSimpleFill,
  PiPlusBold,
  PiCheckBold,
  PiXBold,
} from 'react-icons/pi'

const STATUS_META = {
  available:            { Icon: PiClipboardTextFill, bg: 'var(--grape-light)',  color: 'var(--grape-dark)'  },
  picked_up:            { Icon: PiLightningFill,     bg: 'var(--sun-light)',    color: 'var(--sun-dark)'    },
  pending_verification: { Icon: PiHourglassHighFill, bg: '#FFF4B2',             color: '#9B7A00'            },
  completed:            { Icon: PiCheckCircleFill,   bg: 'var(--mint-light)',   color: 'var(--mint-dark)'   },
}

const STATUS_LABEL = {
  all:                  'All',
  available:            'Available',
  picked_up:            'In Progress',
  pending_verification: 'Pending',
  completed:            'Done',
}

export default function Tasks() {
  const { isParent, isChild } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', points: '' })
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState('')

  useEffect(() => { loadTasks() }, [])

  const loadTasks = async () => {
    try { const data = await api.getTasks(); setTasks(data) }
    catch { } finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!form.title || !form.points) return toast.error('Fill in title and points')
    const pts = parseInt(form.points)
    if (pts <= 0) return toast.error('Points must be positive')
    setCreating(true)
    try {
      await api.createTask({ title: form.title, description: form.description, points: pts })
      toast.success('Task created!')
      setForm({ title: '', description: '', points: '' })
      setShowCreate(false)
      loadTasks()
    } catch (err) { toast.error(err.message) }
    finally { setCreating(false) }
  }

  const handlePickup   = async (id) => { setActionLoading(id); try { await api.pickupTask(id);     toast.success('Task picked up! 💪'); loadTasks() } catch (e) { toast.error(e.message) } finally { setActionLoading('') } }
  const handleComplete = async (id) => { setActionLoading(id); try { await api.completeTask(id);   toast.success('Marked done! Waiting for approval'); loadTasks() } catch (e) { toast.error(e.message) } finally { setActionLoading('') } }
  const handleVerify   = async (id, ok) => { setActionLoading(id); try { await api.verifyTask(id, ok); toast.success(ok ? 'Approved! Points awarded' : 'Task rejected'); loadTasks() } catch (e) { toast.error(e.message) } finally { setActionLoading('') } }
  const handleDelete   = async (id) => { setActionLoading(id); try { await api.deleteTask(id);    toast.success('Task deleted'); loadTasks() } catch (e) { toast.error(e.message) } finally { setActionLoading('') } }

  const statusFilters  = ['all', 'available', 'picked_up', 'pending_verification', 'completed']
  const filteredTasks  = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  if (loading) return <div className="loading-page"><div className="spinner" /><span className="logo">Tasks</span></div>

  return (
    <div className="page">
      {/* Hero */}
      <div className="page-hero hero-coral">
        <div className="greeting animate-fadeInUp">Task Pool</div>
        <div className="greeting-sub">
          {isParent ? 'Create tasks & reward your kids' : 'Pick up tasks to earn points!'}
        </div>
      </div>

      <div className="page-content">

        {/* Filters */}
        <div className="tabs animate-fadeInUp" style={{ animationDelay: '0.05s' }}>
          {statusFilters.map(s => {
            const meta = STATUS_META[s]
            return (
              <button
                key={s}
                className={`tab ${filter === s ? 'active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {meta && filter !== s && (
                  <meta.Icon size={12} style={{ marginRight: 2 }} />
                )}
                {STATUS_LABEL[s] || s}
              </button>
            )
          })}
        </div>

        {/* Task list */}
        <div className="stagger-children">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <PiClipboardTextFill size={52} style={{ color: 'var(--border)', display: 'block', margin: '0 auto 12px' }} />
              <p>{isParent ? 'No tasks yet! Tap + to create one.' : 'No tasks here! Check back soon.'}</p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const meta = STATUS_META[task.status] || STATUS_META.available
              const { Icon } = meta
              return (
                <motion.div key={task.id} className="task-card" whileTap={{ scale: 0.97 }}>
                  {/* Left: checkbox for child's active tasks, status icon otherwise */}
                  {isChild && task.status === 'picked_up' ? (
                    <button
                      aria-label="Mark done"
                      onClick={() => handleComplete(task.id)}
                      disabled={actionLoading === task.id}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        border: '2.5px solid var(--coral)', background: 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    />
                  ) : isChild && task.status === 'pending_verification' ? (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <PiCheckBold size={16} color="#fff" />
                    </div>
                  ) : (
                    <div style={{
                      width: 36, height: 36, borderRadius: 12,
                      background: meta.bg, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={18} color={meta.color} />
                    </div>
                  )}

                  <div className="task-info">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className={`badge badge-status-${task.status}`}>
                        {STATUS_LABEL[task.status] || task.status}
                      </span>
                      {task.child_name && (
                        <span style={{ fontWeight: 700 }}>· {task.child_name}</span>
                      )}
                    </div>
                  </div>

                  <div className="task-actions">
                    <span className="badge badge-points" style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                      <PiStarPoints />+{task.points}
                    </span>

                    {isChild && task.status === 'available' && (
                      <motion.button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handlePickup(task.id)}
                        disabled={actionLoading === task.id}
                        whileTap={{ scale: 0.94 }}
                      >
                        <PiHandFill size={14} /> Pick Up
                      </motion.button>
                    )}

                    {isParent && task.status === 'pending_verification' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <motion.button
                          aria-label="Approve task"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '8px 10px', minHeight: 'unset' }}
                          onClick={() => handleVerify(task.id, true)}
                          disabled={actionLoading === task.id}
                          whileTap={{ scale: 0.94 }}
                        >
                          <PiCheckBold size={16} />
                        </motion.button>
                        <motion.button
                          aria-label="Reject task"
                          className="btn btn-danger btn-sm"
                          style={{ padding: '8px 10px', minHeight: 'unset' }}
                          onClick={() => handleVerify(task.id, false)}
                          disabled={actionLoading === task.id}
                          whileTap={{ scale: 0.94 }}
                        >
                          <PiXBold size={16} />
                        </motion.button>
                      </div>
                    )}

                    {isParent && task.status === 'available' && (
                      <motion.button
                        aria-label="Delete task"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(task.id)}
                        disabled={actionLoading === task.id}
                        style={{ color: 'var(--coral)', padding: '8px 10px' }}
                        whileTap={{ scale: 0.94 }}
                      >
                        <PiTrashSimpleFill size={16} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* FAB */}
      {isParent && (
        <button className="fab" onClick={() => setShowCreate(true)}>
          <PiPlusBold size={24} />
        </button>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="modal-title">New Task</h2>

            <div className="input-group">
              <label className="input-label">Task Name</label>
              <input className="input" placeholder="e.g., Do the dishes" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoCorrect="off" autoCapitalize="sentences" />
            </div>
            <div className="input-group">
              <label className="input-label">Description (optional)</label>
              <textarea className="input" placeholder="What needs to be done?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} autoCorrect="off" autoCapitalize="sentences" />
            </div>
            <div className="input-group">
              <label className="input-label">Points Reward</label>
              <input className="input" type="number" placeholder="e.g., 15" value={form.points} onChange={e => setForm({ ...form, points: e.target.value })} min="1" inputMode="numeric" autoComplete="off" />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <motion.button className="btn btn-ghost btn-full" onClick={() => setShowCreate(false)} whileTap={{ scale: 0.94 }}>Cancel</motion.button>
              <motion.button className="btn btn-primary btn-full" onClick={handleCreate} disabled={creating} whileTap={{ scale: 0.94 }}>
                {creating ? 'Creating…' : <><PiCheckBold size={16} /> Create</>}
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* Tiny inline star icon for points badges */
function PiStarPoints() {
  return (
    <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor">
      <path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34l13.49-58.54L22.35,114.38a16,16,0,0,1,9.16-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.64,0l23.22,55.36,59.45,5.15a16,16,0,0,1,9.16,28.06Z"/>
    </svg>
  )
}
