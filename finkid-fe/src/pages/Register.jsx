import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', username: '', displayName: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password || !form.username || !form.displayName) {
      return toast.error('Please fill in all fields')
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }
    setLoading(true)
    try {
      await register(form.email, form.password, form.username, form.displayName)
      toast.success('Account created! 🎉')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Hero */}
      <div className="auth-hero" style={{ paddingBottom: 40 }}>
        <span className="mascot">🐷</span>
        <h1 className="auth-brand">finkid</h1>
        <p className="auth-tagline">Join the adventure! 🚀</p>
      </div>

      {/* Bottom sheet */}
      <div className="auth-sheet">
        <div className="auth-sheet-handle" />
        <h2 className="auth-sheet-title">Create Account 🎉</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Your Name</label>
            <input
              className="input"
              name="displayName"
              placeholder="What should we call you?"
              value={form.displayName}
              onChange={handleChange}
              autoCorrect="off"
              autoCapitalize="words"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Username</label>
            <input
              className="input"
              name="username"
              placeholder="Choose a cool username"
              value={form.username}
              onChange={handleChange}
              autoCorrect="off"
              autoCapitalize="none"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              className="input"
              type="email"
              name="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
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
              name="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          <motion.button
            className="btn btn-primary btn-full btn-lg"
            type="submit"
            disabled={loading}
            style={{ marginTop: 4 }}
            whileTap={{ scale: 0.94 }}
          >
            {loading ? '⏳ Creating...' : '✨ Create Account'}
          </motion.button>
        </form>

        <div className="auth-footer" style={{ marginTop: 20 }}>
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  )
}
