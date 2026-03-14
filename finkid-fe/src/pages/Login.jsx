import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back! 🐷')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Hero */}
      <div className="auth-hero">
        <span className="mascot">🐷</span>
        <h1 className="auth-brand">finkid</h1>
        <p className="auth-tagline">Earn, save & dream big! ✨</p>
      </div>

      {/* Bottom sheet */}
      <motion.div
        className="auth-sheet"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      >
        <div className="auth-sheet-handle" />
        <h2 className="auth-sheet-title">Welcome back! 👋</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              autoCorrect="off"
              autoCapitalize="none"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="Your secret password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <motion.button
            className="btn btn-primary btn-full btn-lg"
            type="submit"
            disabled={loading}
            style={{ marginTop: 4 }}
            whileTap={{ scale: 0.94 }}
          >
            {loading ? '⏳ Logging in...' : '🚀 Let\'s Go!'}
          </motion.button>
        </form>

        <div className="auth-footer" style={{ marginTop: 20 }}>
          New here? <Link to="/register">Create Account</Link>
        </div>
      </motion.div>
    </div>
  )
}
