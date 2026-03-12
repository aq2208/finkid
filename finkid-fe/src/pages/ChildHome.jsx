import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { motion } from 'framer-motion'
import {
  PiStarFill,
  PiSparkle,
  PiClipboardTextFill,
  PiHourglassHighFill,
  PiCheckBold,
  PiPlusBold,
} from 'react-icons/pi'

const dreamIcons = ['🌟', '🎮', '📚', '🚲', '🧸', '🎨', '⚽', '🎸', '🎁', '🏆']

export default function ChildHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dreams, setDreams] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [dreamsData, tasksData] = await Promise.all([
        api.getDreams(),
        api.getTasks(),
      ])
      setDreams(dreamsData)
      setTasks(tasksData)
    } catch { } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (id) => {
    setActionLoading(id)
    try {
      await api.completeTask(id)
      toast.success('Marked done! Waiting for approval 🎉')
      loadData()
    } catch (e) { toast.error(e.message) }
    finally { setActionLoading('') }
  }

  const activeDream = dreams.find(d => d.is_active)
  const myTasks = tasks.filter(t => ['picked_up', 'pending_verification'].includes(t.status)).slice(0, 5)
  const totalPoints = user?.total_points || 0

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <span className="logo">🐷</span>
    </div>
  )

  return (
    <div className="page">
      {/* Hero */}
      <div className="page-hero" style={{
        background: 'linear-gradient(135deg, #FF9A6C 0%, #FF6B5B 40%, #9C88FF 100%)',
      }}>
        <div className="greeting animate-fadeInUp">
          Hi, {user?.display_name}! 🌟
        </div>
        <div className="greeting-sub" style={{ marginBottom: 16 }}>
          You're doing amazing — keep it up!
        </div>
        {/* Points chip */}
        <div className="points-chip animate-bounceIn" style={{ animationDelay: '0.1s' }}>
          <PiStarFill size={16} style={{ color: 'var(--sun-dark)' }} />
          <span>{totalPoints} points</span>
        </div>
      </div>

      <div className="page-content">

        {/* Dreams Section */}
        <div className="section-title animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <PiSparkle size={18} style={{ color: 'var(--grape)' }} /> My Dreams
        </div>

        {!activeDream ? (
          <div className="empty-state animate-fadeInUp" style={{ padding: '20px', animationDelay: '0.15s' }}>
            <span className="empty-emoji">🌈</span>
            <p>No active dream! Pick one to save toward 👇</p>
            <motion.button className="btn btn-primary btn-sm" onClick={() => navigate('/dreams')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
              whileTap={{ scale: 0.94 }}>
              <PiPlusBold size={13} /> Go to Dreams
            </motion.button>
          </div>
        ) : (() => {
          const progress = activeDream.target_points
            ? Math.round((activeDream.earned_points / activeDream.target_points) * 100)
            : 0
          const remaining = (activeDream.target_points || 0) - (activeDream.earned_points || 0)
          return (
            <div
              className="animate-fadeInUp"
              onClick={() => navigate('/dreams')}
              style={{
                animationDelay: '0.15s',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #FF9A6C 0%, #FF6B5B 50%, #9C88FF 100%)',
                borderRadius: 24,
                padding: '20px 20px 18px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(255,107,91,0.35)',
              }}
            >
              {/* Decorative blobs */}
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 100, height: 100, borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
              }} />
              <div style={{
                position: 'absolute', bottom: -30, left: 10,
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
              }} />

              {/* Top row: icon + title + points remaining */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>{dreamIcons[0]}</span>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                      Saving for
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fff', lineHeight: 1.1 }}>
                      {activeDream.title}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#fff', lineHeight: 1 }}>
                    {progress}%
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
                    done
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{
                background: 'rgba(255,255,255,0.25)',
                borderRadius: 99, height: 10, marginBottom: 10, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: `${Math.min(progress, 100)}%`,
                  background: '#fff',
                  boxShadow: '0 0 8px rgba(255,255,255,0.6)',
                  transition: 'width 0.5s ease',
                }} />
              </div>

              {/* Bottom row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                  {activeDream.earned_points} / {activeDream.target_points} pts
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 99, padding: '3px 10px',
                  fontSize: '0.75rem', fontWeight: 800, color: '#fff',
                }}>
                  {remaining > 0 ? `${remaining} pts to go!` : '🎉 Goal reached!'}
                </span>
              </div>
            </div>
          )
        })()}

        {/* Available Tasks */}
        <div className="section-title animate-fadeInUp" style={{ marginTop: 28, animationDelay: '0.2s' }}>
          <PiClipboardTextFill size={18} style={{ color: 'var(--coral)' }} /> Tasks for You
        </div>

        <div className="stagger-children">
          {myTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}>
              <PiClipboardTextFill size={48} style={{ color: 'var(--border)', display: 'block', margin: '0 auto 12px' }} />
              <p>No tasks in progress. Head to Tasks to pick one up!</p>
            </div>
          ) : (
            myTasks.map(task => (
              <div key={task.id} className="task-card">
                {task.status === 'picked_up' ? (
                  <button
                    onClick={() => handleComplete(task.id)}
                    disabled={actionLoading === task.id}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      border: '2.5px solid var(--coral)', background: 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  />
                ) : (
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <PiCheckBold size={16} color="#fff" />
                  </div>
                )}
                <div className="task-info" onClick={() => navigate('/tasks')} style={{ cursor: 'pointer' }}>
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span className={`badge badge-status-${task.status}`}>
                      {task.status === 'picked_up' ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                </div>
                <span className="badge badge-points" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                  +{task.points} <PiStarFill size={11} />
                </span>
              </div>
            ))
          )}
        </div>

        {myTasks.length > 0 && (
          <motion.button
            className="btn btn-secondary btn-full"
            style={{ marginTop: 12 }}
            onClick={() => navigate('/tasks')}
            whileTap={{ scale: 0.94 }}
          >
            Show more
          </motion.button>
        )}

      </div>
    </div>
  )
}
