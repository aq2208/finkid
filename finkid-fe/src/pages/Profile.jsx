import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import {
  PiCopySimpleFill, PiStarFill,
  PiGearSixFill, PiCaretRightBold, PiWarningFill,
  PiPencilSimpleFill, PiSmileyStickerFill, PiSignOutFill,
} from 'react-icons/pi'

const AVATAR_OPTIONS = ['🦊','🐻','🐼','🐸','🦋','🐬','🦁','🐯','🦄','🦖','🐙','🦕']

export default function Profile() {
  const { user, isParent, logout, refreshProfile } = useAuth()
  const [family, setFamily] = useState(null)
  const [loading, setLoading] = useState(true)

  const [showSettings, setShowSettings] = useState(false)
  const [showEditName, setShowEditName] = useState(false)
  const [showEditAvatar, setShowEditAvatar] = useState(false)
  const [showLeaveFamily, setShowLeaveFamily] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadFamily() }, [])

  const loadFamily = async () => {
    try {
      const data = await api.getMyFamily()
      setFamily(data)
    } catch { } finally {
      setLoading(false)
    }
  }

  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      toast.error('Name cannot be empty')
      return
    }
    setSaving(true)
    try {
      await api.updateProfile({ display_name: nameInput.trim() })
      await refreshProfile()
      setShowEditName(false)
      setShowSettings(false)
      toast.success('Name updated!')
    } catch (e) {
      toast.error(e.message || 'Failed to update name')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) return
    setSaving(true)
    try {
      await api.updateProfile({ avatar_url: selectedAvatar })
      await refreshProfile()
      setShowEditAvatar(false)
      setShowSettings(false)
      toast.success('Avatar updated!')
    } catch (e) {
      toast.error(e.message || 'Failed to update avatar')
    } finally {
      setSaving(false)
    }
  }

  const handleLeaveFamily = async () => {
    setSaving(true)
    try {
      await api.leaveFamily()
      await refreshProfile()
      // hasFamily becomes false → App.jsx gate redirects to FamilySetup
    } catch (e) {
      toast.error(e.message || 'Failed to leave family')
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <span className="logo">👤</span>
    </div>
  )

  return (
    <div className="page">
      {/* Hero */}
      <div
        className="page-hero animate-fadeInUp"
        style={{
          background: isParent
            ? 'linear-gradient(135deg, #5DD67C 0%, #4FC3F7 100%)'
            : 'linear-gradient(135deg, #FF9A6C 0%, #9C88FF 100%)',
          paddingBottom: 56,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Gear button */}
        <button
          onClick={() => setShowSettings(true)}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,0.2)', border: 'none',
            borderRadius: '50%', width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', backdropFilter: 'blur(8px)', cursor: 'pointer',
          }}
        >
          <PiGearSixFill size={22} />
        </button>

        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          backdropFilter: 'blur(8px)',
          border: '3px solid rgba(255,255,255,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.5rem', marginBottom: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}>
          {user?.avatar_url || (isParent ? '👨‍👩‍👧' : '🧒')}
        </div>
        <div className="greeting">{user?.display_name}</div>
        <div className="greeting-sub">@{user?.username}</div>
        {!isParent && (
          <div
            className="points-chip animate-bounceIn"
            style={{ marginTop: 12, animationDelay: '0.1s' }}
          >
            <PiStarFill size={16} style={{ color: 'var(--sun-dark)' }} />
            <span>{user?.total_points || 0} points</span>
          </div>
        )}
      </div>

      <div className="page-content" style={{ paddingTop: 32 }}>

        {/* Role badge */}
        <div className="card animate-fadeInUp" style={{ marginBottom: 16, padding: '14px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                Role
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                {isParent ? '👨‍👩‍👧 Parent' : '🧒 Kid'}
              </div>
            </div>
            <span className={`badge badge-status-${isParent ? 'approved' : 'in_progress'}`} style={{ fontSize: '0.8rem' }}>
              {isParent ? 'Manager' : 'Earner'}
            </span>
          </div>
        </div>

        {/* Family Card */}
        {family && (
          <div className="card animate-fadeInUp" style={{ marginBottom: 16, animationDelay: '0.1s' }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              🏠 {family.name}
            </div>

            {/* Family code */}
            <div
              style={{
                background: 'var(--sun-light)',
                border: '2px dashed var(--sun)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                cursor: 'pointer',
              }}
              onClick={() => {
                navigator.clipboard.writeText(family.join_code)
                toast.success('Code copied! 📋')
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--sun-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Family Code · tap to copy
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.6rem',
                  color: 'var(--coral)',
                  letterSpacing: 6,
                }}>
                  {family.join_code}
                </div>
              </div>
              <PiCopySimpleFill size={22} style={{ color: 'var(--sun-dark)', opacity: 0.8 }} />
            </div>

            {/* Members */}
            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              Members
            </div>
            {family.members?.map(member => (
              <div key={member.id} className="member-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={`member-avatar ${member.role}`}>
                    {member.avatar_url || (member.role === 'parent' ? '👨‍👩‍👧' : '🧒')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{member.display_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'capitalize' }}>
                      {member.role}
                    </div>
                  </div>
                </div>
                {member.role === 'child' && (
                  <span className="badge badge-points" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <PiStarFill size={11} /> {member.total_points || 0}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Logout */}
        <button
          className="btn btn-danger btn-full animate-fadeInUp"
          style={{ animationDelay: '0.2s' }}
          onClick={logout}
        >
          🚪 Logout
        </button>

      </div>

      {/* ── Settings Sheet ── */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ fontWeight: 900, fontSize: '1.15rem', marginBottom: 20 }}>Settings</div>

            {/* Edit Name */}
            <button
              onClick={() => { setNameInput(user?.display_name || ''); setShowEditName(true) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', background: 'var(--bg-card)', border: 'none',
                borderRadius: 'var(--radius-md)', padding: '14px 16px',
                marginBottom: 10, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <PiPencilSimpleFill size={20} style={{ color: 'var(--coral)' }} />
                <span style={{ fontWeight: 700 }}>Edit Name</span>
              </div>
              <PiCaretRightBold size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>

            {/* Change Avatar */}
            <button
              onClick={() => { setSelectedAvatar(user?.avatar_url || null); setShowEditAvatar(true) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', background: 'var(--bg-card)', border: 'none',
                borderRadius: 'var(--radius-md)', padding: '14px 16px',
                marginBottom: 10, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <PiSmileyStickerFill size={20} style={{ color: 'var(--grape)' }} />
                <span style={{ fontWeight: 700 }}>Change Avatar</span>
              </div>
              <PiCaretRightBold size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>

            {/* Leave Family — only if in a family */}
            {family && (
              <button
                onClick={() => setShowLeaveFamily(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', background: 'var(--bg-card)', border: 'none',
                  borderRadius: 'var(--radius-md)', padding: '14px 16px',
                  marginBottom: 10, cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <PiSignOutFill size={20} style={{ color: 'var(--coral)' }} />
                  <span style={{ fontWeight: 700, color: 'var(--coral)' }}>Leave Family</span>
                </div>
                <PiCaretRightBold size={16} style={{ color: 'var(--coral)' }} />
              </button>
            )}

            <button className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={() => setShowSettings(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Edit Name Sheet ── */}
      {showEditName && (
        <div className="modal-overlay" onClick={() => setShowEditName(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ fontWeight: 900, fontSize: '1.15rem', marginBottom: 20 }}>Edit Name</div>
            <div className="input-group">
              <input
                className="input"
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="Your display name"
                autoFocus
              />
            </div>
            <button
              className="btn btn-primary btn-full"
              style={{ marginBottom: 10 }}
              onClick={handleSaveName}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="btn btn-secondary btn-full" onClick={() => setShowEditName(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Change Avatar Sheet ── */}
      {showEditAvatar && (
        <div className="modal-overlay" onClick={() => setShowEditAvatar(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ fontWeight: 900, fontSize: '1.15rem', marginBottom: 20 }}>Choose Avatar</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
              {AVATAR_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setSelectedAvatar(emoji)}
                  style={{
                    width: '100%', aspectRatio: '1',
                    fontSize: '2rem',
                    background: selectedAvatar === emoji ? 'rgba(255,107,74,0.12)' : 'var(--bg-card)',
                    border: selectedAvatar === emoji ? '2px solid var(--coral)' : '2px solid transparent',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary btn-full"
              style={{ marginBottom: 10 }}
              onClick={handleSaveAvatar}
              disabled={saving || !selectedAvatar}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="btn btn-secondary btn-full" onClick={() => setShowEditAvatar(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Leave Family Sheet ── */}
      {showLeaveFamily && (
        <div className="modal-overlay" onClick={() => setShowLeaveFamily(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
              <PiWarningFill size={48} style={{ color: 'var(--coral)', marginBottom: 12 }} />
              <div style={{ fontWeight: 900, fontSize: '1.15rem', marginBottom: 8 }}>Leave Family?</div>
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.5 }}>
                You will lose access to family tasks, dreams, and the leaderboard. You can rejoin using a code.
              </div>
            </div>
            <button
              className="btn btn-danger btn-full"
              style={{ marginBottom: 10 }}
              onClick={handleLeaveFamily}
              disabled={saving}
            >
              {saving ? 'Leaving…' : 'Yes, Leave Family'}
            </button>
            <button className="btn btn-secondary btn-full" onClick={() => setShowLeaveFamily(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
