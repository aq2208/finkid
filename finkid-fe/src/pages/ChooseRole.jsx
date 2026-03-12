import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function ChooseRole() {
  const { setRole, logout } = useAuth()
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    if (!selected) return toast.error('Pick your role first!')
    setLoading(true)
    try {
      await setRole(selected)
      toast.success(selected === 'parent' ? 'Welcome, parent! 👨‍👩‍👧' : 'Awesome! Let\'s go! 🚀')
    } catch (err) {
      toast.error(err.message || 'Failed to set role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <span className="mascot">🤔</span>
        <h1 className="auth-brand">Who are you?</h1>
        <p className="auth-tagline">Pick your role to get started</p>
      </div>

      <div className="auth-sheet">
        <div className="auth-sheet-handle" />

        <div className="role-grid">
          <div
            className={`role-card ${selected === 'child' ? 'selected' : ''}`}
            onClick={() => setSelected('child')}
          >
            <span className="role-emoji">🧒</span>
            <div className="role-name">I'm a Kid</div>
            <div className="role-desc">Earn points &amp; achieve my dreams!</div>
          </div>

          <div
            className={`role-card ${selected === 'parent' ? 'selected' : ''}`}
            onClick={() => setSelected('parent')}
          >
            <span className="role-emoji">👨‍👩‍👧</span>
            <div className="role-name">I'm a Parent</div>
            <div className="role-desc">Help my kids learn about money</div>
          </div>
        </div>

        <motion.button
          className="btn btn-primary btn-full btn-lg"
          onClick={handleContinue}
          disabled={!selected || loading}
          whileTap={{ scale: 0.94 }}
        >
          {loading ? '⏳...' : '✨ Continue'}
        </motion.button>

        <div className="auth-footer" style={{ marginTop: 16 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); logout() }}>← Back to Login</a>
        </div>
      </div>
    </div>
  )
}
