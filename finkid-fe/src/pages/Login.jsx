import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

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
      <div className="auth-sheet">
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

          <button
            className="btn btn-primary btn-full btn-lg"
            type="submit"
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading ? '⏳ Logging in...' : '🚀 Let\'s Go!'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: 20 }}>
          New here? <Link to="/register">Create Account</Link>
        </div>
      </div>
    </div>
  )
}
