import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function FamilySetup() {
  const { isParent, refreshProfile, logout } = useAuth()
  const [mode, setMode] = useState(null)
  const [familyName, setFamilyName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!familyName) return toast.error('Enter a family name')
    setLoading(true)
    try {
      const result = await api.createFamily(familyName)
      setCreatedCode(result.join_code)
      await refreshProfile()
      toast.success('Family created! 🏠')
    } catch (err) {
      toast.error(err.message || 'Failed to create family')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!joinCode) return toast.error('Enter a family code')
    setLoading(true)
    try {
      await api.joinFamily(joinCode)
      await refreshProfile()
      toast.success('Joined the family! 🎉')
    } catch (err) {
      toast.error(err.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <span className="mascot">🏠</span>
        <h1 className="auth-brand">Family Time!</h1>
        <p className="auth-tagline">
          {isParent ? 'Create or join a family' : 'Join your family with a code'}
        </p>
      </div>

      <div className="auth-sheet">
        <div className="auth-sheet-handle" />

        {/* Pick mode */}
        {!mode && !createdCode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isParent && (
              <motion.button className="btn btn-primary btn-full btn-lg" onClick={() => setMode('create')} whileTap={{ scale: 0.94 }}>
                🏠 Create a Family
              </motion.button>
            )}
            <motion.button className="btn btn-secondary btn-full btn-lg" onClick={() => setMode('join')} whileTap={{ scale: 0.94 }}>
              🔑 Join with Code
            </motion.button>
          </div>
        )}

        {/* Create mode */}
        {mode === 'create' && !createdCode && (
          <div>
            <h2 className="auth-sheet-title" style={{ marginBottom: 20 }}>Name your family 🏠</h2>
            <div className="input-group">
              <label className="input-label">Family Name</label>
              <input
                className="input"
                placeholder="e.g., The Smiths"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                autoCorrect="off"
                autoCapitalize="words"
              />
            </div>
            <motion.button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleCreate}
              disabled={loading}
              whileTap={{ scale: 0.94 }}
            >
              {loading ? '⏳...' : '✨ Create Family'}
            </motion.button>
            <motion.button className="btn btn-ghost btn-full" onClick={() => setMode(null)} style={{ marginTop: 8 }} whileTap={{ scale: 0.94 }}>
              ← Back
            </motion.button>
          </div>
        )}

        {/* Code reveal */}
        {createdCode && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
            <p style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4, color: 'var(--text-primary)' }}>
              Share this code!
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 12 }}>
              Your children can use this code to join the family
            </p>
            <div className="family-code">{createdCode}</div>
            <motion.button
              className="btn btn-primary btn-full"
              onClick={() => {
                navigator.clipboard.writeText(createdCode)
                toast.success('Code copied! 📋')
              }}
              style={{ marginTop: 16 }}
              whileTap={{ scale: 0.94 }}
            >
              📋 Copy Code
            </motion.button>
          </div>
        )}

        {/* Join mode */}
        {mode === 'join' && (
          <div>
            <h2 className="auth-sheet-title" style={{ marginBottom: 20 }}>Enter the code 🔑</h2>
            <div className="input-group">
              <label className="input-label">Family Code</label>
              <input
                className="input"
                placeholder="ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '1.4rem', fontWeight: 800 }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
              />
            </div>
            <motion.button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleJoin}
              disabled={loading}
              whileTap={{ scale: 0.94 }}
            >
              {loading ? '⏳...' : '🔑 Join Family'}
            </motion.button>
            <motion.button className="btn btn-ghost btn-full" onClick={() => setMode(null)} style={{ marginTop: 8 }} whileTap={{ scale: 0.94 }}>
              ← Back
            </motion.button>
          </div>
        )}

        <div className="auth-footer" style={{ marginTop: 24 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); logout() }}>← Logout</a>
        </div>
      </div>
    </div>
  )
}
