import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import {
  PiCheckBold,
  PiXBold,
  PiStarFill,
  PiClipboardTextFill,
  PiSparkle,
  PiAlarmFill,
  PiUsersThreeFill,
  PiCheckCircleFill,
} from 'react-icons/pi'

export default function ParentHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [family, setFamily] = useState(null)
  const [dreams, setDreams] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [pointsInput, setPointsInput] = useState({})
  const [actionLoading, setActionLoading] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [familyData, dreamsData, tasksData] = await Promise.all([
        api.getMyFamily(),
        api.getDreams(),
        api.getTasks(),
      ])
      setFamily(familyData)
      setDreams(dreamsData)
      setTasks(tasksData)
    } catch { } finally {
      setLoading(false)
    }
  }

  const pendingDreams = dreams.filter(d => d.status === 'pending_approval')
  const pendingTasks  = tasks.filter(t => t.status === 'pending_verification')
  const children      = family?.members?.filter(m => m.role === 'child') || []
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const pendingCount   = pendingDreams.length + pendingTasks.length

  const handleApproveDream = async (dreamId) => {
    const pts = parseInt(pointsInput[dreamId])
    if (!pts || pts <= 0) return toast.error('Enter valid points')
    setActionLoading(dreamId)
    try {
      await api.approveDream(dreamId, pts)
      toast.success('Dream approved! ✨')
      loadData()
    } catch (err) { toast.error(err.message) }
    finally { setActionLoading('') }
  }

  const handleRejectDream = async (dreamId) => {
    setActionLoading(dreamId)
    try {
      await api.rejectDream(dreamId)
      toast.success('Dream rejected')
      loadData()
    } catch (err) { toast.error(err.message) }
    finally { setActionLoading('') }
  }

  const handleVerifyTask = async (taskId, approved) => {
    setActionLoading(taskId)
    try {
      await api.verifyTask(taskId, approved)
      toast.success(approved ? 'Task approved! ⭐' : 'Task rejected')
      loadData()
    } catch (err) { toast.error(err.message) }
    finally { setActionLoading('') }
  }

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <span className="logo">🐷</span>
    </div>
  )

  return (
    <div className="page">
      {/* Hero */}
      <div className="page-hero hero-mint">
        <div className="greeting animate-fadeInUp">
          Hi, {user?.display_name}! 👋
        </div>
        <div className="greeting-sub" style={{ marginBottom: 16 }}>
          Your family is doing great!
        </div>
        {/* Family code chip */}
        {family && (
          <button
            className="points-chip animate-bounceIn"
            style={{ animationDelay: '0.1s', cursor: 'pointer', border: 'none', fontFamily: 'var(--font)' }}
            onClick={() => {
              navigator.clipboard.writeText(family.join_code)
              toast.success('Family code copied! 📋')
            }}
          >
            <span>🏠</span>
            <span style={{ fontFamily: 'var(--font-display)', letterSpacing: 3 }}>{family.join_code}</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>tap to copy</span>
          </button>
        )}
      </div>

      <div className="page-content">

        {/* Stats */}
        <div className="stats-grid animate-fadeInUp" style={{ animationDelay: '0.05s' }}>
          <div className="stat-card">
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <PiUsersThreeFill size={22} style={{ color: 'var(--sky-dark)' }} /> {children.length}
            </div>
            <div className="stat-label">Kids</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <PiCheckCircleFill size={22} style={{ color: 'var(--mint-dark)' }} /> {completedCount}
            </div>
            <div className="stat-label">Tasks Done</div>
          </div>
        </div>

        {/* Pending Notifications Banner */}
        {pendingCount > 0 && (
          <div
            className="animate-fadeInUp"
            style={{
              background: 'linear-gradient(135deg, var(--sun-light), #FFF0B2)',
              border: '2px solid var(--sun)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 16px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              animationDelay: '0.1s',
            }}
          >
            <PiAlarmFill size={26} style={{ color: 'var(--sun-dark)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                {pendingCount} item{pendingCount > 1 ? 's' : ''} need your attention!
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Review below 👇
              </div>
            </div>
          </div>
        )}

        {/* Pending Task Verifications */}
        {pendingTasks.length > 0 && (
          <div className="animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
            <div className="section-title">
              <PiCheckCircleFill size={18} style={{ color: 'var(--mint-dark)' }} /> Tasks to Verify
              <span className="badge badge-status-pending_verification">{pendingTasks.length}</span>
            </div>
            {pendingTasks.map(task => (
              <div key={task.id} className="approval-card">
                <div className="approval-title">{task.title}</div>
                <div className="approval-meta">
                  Done by: <strong>{task.child_name || 'Child'}</strong>
                  {' · '}
                  <span className="badge badge-points" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <PiStarFill size={11} /> {task.points} pts
                  </span>
                </div>
                <div className="approval-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleVerifyTask(task.id, true)}
                    disabled={actionLoading === task.id}
                  >
                    <PiCheckBold size={14} /> Approve
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleVerifyTask(task.id, false)}
                    disabled={actionLoading === task.id}
                  >
                    <PiXBold size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending Dream Approvals */}
        {pendingDreams.length > 0 && (
          <div className="animate-fadeInUp" style={{ marginTop: 16, animationDelay: '0.2s' }}>
            <div className="section-title">
              <PiSparkle size={18} style={{ color: 'var(--grape)' }} /> Dreams to Review
              <span className="badge badge-status-pending_approval">{pendingDreams.length}</span>
            </div>
            {pendingDreams.map(dream => (
              <div key={dream.id} className="approval-card" style={{ borderLeftColor: 'var(--grape)' }}>
                <div className="approval-title">{dream.title}</div>
                <div className="approval-meta">
                  By: <strong>{dream.child_name || 'Child'}</strong>
                  {dream.description && <> · "{dream.description}"</>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <PiStarFill size={13} style={{ color: 'var(--sun-dark)' }} /> Target pts:
                  </span>
                  <input
                    className="points-input"
                    type="number"
                    placeholder="100"
                    value={pointsInput[dream.id] || ''}
                    onChange={(e) => setPointsInput({ ...pointsInput, [dream.id]: e.target.value })}
                    min="1"
                    inputMode="numeric"
                  />
                </div>
                <div className="approval-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleApproveDream(dream.id)}
                    disabled={actionLoading === dream.id}
                  >
                    <PiCheckBold size={14} /> Approve
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRejectDream(dream.id)}
                    disabled={actionLoading === dream.id}
                  >
                    <PiXBold size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {pendingCount === 0 && (
          <div className="empty-state animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
            <span className="empty-emoji">🎉</span>
            <p>All caught up! No pending reviews.</p>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }} className="animate-fadeInUp">
          <button className="btn btn-primary btn-full" onClick={() => navigate('/tasks')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <PiClipboardTextFill size={16} /> Manage Tasks
          </button>
          <button className="btn btn-secondary btn-full" onClick={() => navigate('/dreams')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <PiSparkle size={16} /> View Dreams
          </button>
        </div>

      </div>
    </div>
  )
}
