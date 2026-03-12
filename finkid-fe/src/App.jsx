import { useRef } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import ChooseRole from './pages/ChooseRole'
import FamilySetup from './pages/FamilySetup'
import ChildHome from './pages/ChildHome'
import ParentHome from './pages/ParentHome'
import Dreams from './pages/Dreams'
import Tasks from './pages/Tasks'
import Profile from './pages/Profile'
import BottomNav from './components/BottomNav'
import PageTransition from './components/PageTransition'

const ROUTE_ORDER = ['/', '/dreams', '/tasks', '/profile']

function getTabDirection(from, to) {
  const fromIdx = ROUTE_ORDER.indexOf(from)
  const toIdx = ROUTE_ORDER.indexOf(to)
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return 0
  return toIdx > fromIdx ? 1 : -1
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="loading-page">
      <div style={{ fontSize: '3rem', animation: 'mascotBounce 2s ease-in-out infinite' }}>🐷</div>
      <span className="logo">finkid</span>
      <div className="spinner" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user, hasRole, hasFamily, isParent } = useAuth()
  const location = useLocation()
  const prevPathRef = useRef(location.pathname)
  const directionRef = useRef(0)

  const newDir = getTabDirection(prevPathRef.current, location.pathname)
  if (prevPathRef.current !== location.pathname) {
    directionRef.current = newDir
    prevPathRef.current = location.pathname
  }
  const direction = directionRef.current

  // If logged in but no role, force role selection
  if (user && !hasRole) return (
    <Routes>
      <Route path="*" element={<ChooseRole />} />
    </Routes>
  )

  // If logged in + role but no family, force family setup
  if (user && hasRole && !hasFamily) return (
    <Routes>
      <Route path="*" element={<FamilySetup />} />
    </Routes>
  )

  return (
    <>
      <AnimatePresence mode="popLayout" custom={direction}>
        <PageTransition key={location.pathname} direction={direction}>
          <Routes location={location}>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                {isParent ? <ParentHome /> : <ChildHome />}
              </ProtectedRoute>
            } />
            <Route path="/dreams" element={
              <ProtectedRoute><Dreams /></ProtectedRoute>
            } />
            <Route path="/tasks" element={
              <ProtectedRoute><Tasks /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageTransition>
      </AnimatePresence>
      {user && hasRole && hasFamily && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <div className="phone-frame">
      <Toaster
        position="top-center"
        containerStyle={{ top: 72 }}
        toastOptions={{
          style: { fontFamily: 'var(--font)', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem' }
        }}
      />
      <AppRoutes />
    </div>
  )
}
