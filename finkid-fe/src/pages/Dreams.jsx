import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  PiStarFill,
  PiCheckBold,
  PiXBold,
  PiPlusBold,
  PiTargetFill,
  PiConfettiFill,
  PiSparkle,
  PiImageFill,
} from 'react-icons/pi'

const DREAM_EMOJIS = ['🌟', '🎮', '📚', '🚲', '🧸', '🎨', '⚽', '🎸', '🎁', '🏆', '🎠', '🦄']

export default function Dreams() {
  const { isParent, isChild } = useAuth()
  const [dreams, setDreams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [pointsInput, setPointsInput] = useState({})
  const [actionLoading, setActionLoading] = useState('')

  useEffect(() => { loadDreams() }, [])

  const loadDreams = async () => {
    try { const data = await api.getDreams(); setDreams(data) }
    catch { } finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!form.title) return toast.error('Enter a dream name')
    setCreating(true)
    let image_url = null
    if (imageFile) {
      setUploading(true)
      const ext = imageFile.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('dream-images').upload(path, imageFile, { upsert: true })
      if (!error) {
        const { data: urlData } = supabase.storage.from('dream-images').getPublicUrl(path)
        image_url = urlData.publicUrl
      }
      setUploading(false)
    }
    try {
      await api.createDream({ ...form, image_url })
      toast.success('Dream created! Waiting for approval')
      setForm({ title: '', description: '' })
      setImageFile(null)
      setImagePreview(null)
      setShowCreate(false)
      loadDreams()
    } catch (err) { toast.error(err.message) }
    finally { setCreating(false) }
  }

  const handleActivate = async (id) => {
    setActionLoading(id)
    try { await api.activateDream(id); toast.success('Dream activated! Keep earning!'); loadDreams() }
    catch (e) { toast.error(e.message) } finally { setActionLoading('') }
  }

  const handleApprove = async (id) => {
    const pts = parseInt(pointsInput[id])
    if (!pts || pts <= 0) return toast.error('Enter valid points')
    setActionLoading(id)
    try { await api.approveDream(id, pts); toast.success('Dream approved!'); loadDreams() }
    catch (e) { toast.error(e.message) } finally { setActionLoading('') }
  }

  const handleReject = async (id) => {
    setActionLoading(id)
    try { await api.rejectDream(id); toast.success('Dream rejected'); loadDreams() }
    catch (e) { toast.error(e.message) } finally { setActionLoading('') }
  }

  const statusFilters = ['all', 'pending_approval', 'approved', 'in_progress', 'fulfilled', 'rejected']
  const filteredDreams = filter === 'all' ? dreams : dreams.filter(d => d.status === filter)

  if (loading) return <div className="loading-page"><div className="spinner" /><span className="logo">Dreams</span></div>

  return (
    <div className="page">
      {/* Hero */}
      <div className="page-hero hero-grape">
        <div className="greeting animate-fadeInUp">
          {isParent ? "Kids' Dreams" : 'My Dreams'}
        </div>
        <div className="greeting-sub">
          {isParent ? "Review & approve your children's dreams" : 'Dream big, earn bigger!'}
        </div>
      </div>

      <div className="page-content">

        {/* Filters */}
        <div className="tabs animate-fadeInUp" style={{ animationDelay: '0.05s' }}>
          {statusFilters.map(s => (
            <button
              key={s}
              className={`tab ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Dreams */}
        <div className="stagger-children">
          {filteredDreams.length === 0 ? (
            <div className="empty-state">
              <PiStarFill size={52} style={{ color: 'var(--grape-light)', display: 'block', margin: '0 auto 12px' }} />
              <p>{isChild ? 'No dreams yet! Create your first one!' : 'No dreams to show'}</p>
            </div>
          ) : (
            filteredDreams.map((dream, idx) => {
              const progress    = dream.target_points ? Math.round((dream.earned_points / dream.target_points) * 100) : 0
              const isFulfilled = dream.status === 'fulfilled'
              const isActive    = dream.is_active
              const emoji       = isFulfilled ? '🎉' : isActive ? '🎯' : DREAM_EMOJIS[idx % DREAM_EMOJIS.length]

              const iconBg = isFulfilled
                ? 'linear-gradient(135deg, #FFD966, #5DD67C)'
                : dream.status === 'in_progress'
                ? 'linear-gradient(135deg, #FF9A6C, #9C88FF)'
                : dream.status === 'approved'
                ? 'linear-gradient(135deg, #5DD67C, #4FC3F7)'
                : dream.status === 'rejected'
                ? 'linear-gradient(135deg, #FF6B5B, #FF9A6C)'
                : 'linear-gradient(135deg, #C3B1FF, #9C88FF)'

              return (
                <div key={dream.id} className={`dream-card status-${dream.status}`} style={{ padding: '14px 16px' }}>
                  {/* Main row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {dream.image_url ? (
                      <img src={dream.image_url} style={{ width: 44, height: 44, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{
                        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                        background: iconBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.4rem',
                      }}>
                        {emoji}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 800, fontSize: '0.95rem',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {dream.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'nowrap' }}>
                        <span className={`badge badge-status-${dream.status}`} style={{ fontSize: '0.7rem', flexShrink: 0 }}>
                          {dream.status.replace(/_/g, ' ')}
                        </span>
                        {isActive && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            background: 'var(--sun-light)', color: 'var(--sun-dark)',
                            borderRadius: 99, padding: '2px 7px',
                            fontSize: '0.68rem', fontWeight: 800, flexShrink: 0,
                          }}>
                            <PiTargetFill size={9} /> ACTIVE
                          </span>
                        )}
                        {isParent && dream.child_name && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            · {dream.child_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {dream.target_points != null && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: '1rem', color: isFulfilled ? 'var(--mint-dark)' : 'var(--text-primary)' }}>
                          {Math.min(progress, 100)}%
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                          {dream.earned_points}/{dream.target_points}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {dream.target_points != null && (
                    <div className="progress-bar" style={{ marginTop: 10, height: 6 }}>
                      <div
                        className={`progress-fill ${isFulfilled ? 'fulfilled' : ''}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  )}

                  {/* Child: Activate */}
                  {isChild && ['approved', 'in_progress'].includes(dream.status) && !isActive && (
                    <motion.button
                      className="btn btn-warning btn-sm"
                      style={{ marginTop: 10, width: '100%' }}
                      onClick={() => handleActivate(dream.id)}
                      disabled={actionLoading === dream.id}
                      whileTap={{ scale: 0.94 }}
                    >
                      <PiTargetFill size={14} /> Set as Active Dream
                    </motion.button>
                  )}

                  {/* Parent: Approve / Reject */}
                  {isParent && dream.status === 'pending_approval' && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        className="points-input"
                        type="number"
                        placeholder="Target pts"
                        value={pointsInput[dream.id] || ''}
                        onChange={e => setPointsInput({ ...pointsInput, [dream.id]: e.target.value })}
                        min="1"
                        style={{ flex: 1 }}
                        inputMode="numeric"
                      />
                      <motion.button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleApprove(dream.id)}
                        disabled={actionLoading === dream.id}
                        style={{ flexShrink: 0 }}
                        whileTap={{ scale: 0.94 }}
                      >
                        <PiCheckBold size={14} /> Approve
                      </motion.button>
                      <motion.button
                        aria-label="Reject dream"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(dream.id)}
                        disabled={actionLoading === dream.id}
                        style={{ flexShrink: 0, padding: '8px 10px' }}
                        whileTap={{ scale: 0.94 }}
                      >
                        <PiXBold size={14} />
                      </motion.button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* FAB */}
      {isChild && (
        <button className="fab" onClick={() => setShowCreate(true)}>
          <PiPlusBold size={24} />
        </button>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => { setShowCreate(false); setImageFile(null); setImagePreview(null) }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="modal-title">New Dream</h2>

            <div className="input-group">
              <label className="input-label">What do you dream of?</label>
              <input className="input" placeholder="e.g., New Bicycle" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoCorrect="off" autoCapitalize="sentences" />
            </div>
            <div className="input-group">
              <label className="input-label">Tell us more (optional)</label>
              <textarea className="input" placeholder="Why do you want this?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} autoCorrect="off" autoCapitalize="sentences" />
            </div>

            {imagePreview ? (
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <img src={imagePreview} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 12 }} />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null) }}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                    width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff', padding: 0,
                  }}
                >
                  <PiXBold size={12} />
                </button>
              </div>
            ) : (
              <div className="btn btn-secondary btn-full" style={{ marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
                <PiImageFill size={16} /> Add a Photo (optional)
                <input
                  type="file" accept="image/*"
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                  onChange={e => {
                    const f = e.target.files[0]
                    if (!f) return
                    setImageFile(f)
                    setImagePreview(URL.createObjectURL(f))
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <motion.button className="btn btn-ghost btn-full" onClick={() => { setShowCreate(false); setImageFile(null); setImagePreview(null) }} whileTap={{ scale: 0.94 }}>Cancel</motion.button>
              <motion.button className="btn btn-primary btn-full" onClick={handleCreate} disabled={creating || uploading} whileTap={{ scale: 0.94 }}>
                {uploading ? 'Uploading…' : creating ? 'Creating…' : <><PiSparkle size={16} /> Create Dream</>}
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
