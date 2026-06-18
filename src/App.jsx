import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login   from './pages/Login'
import Home    from './pages/Home'
import Xbox360 from './pages/Xbox360'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/" replace />
}

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-1">
      <div className="w-8 h-8 border-2 border-xbox border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />

  return (
    <Routes>
      <Route path="/"     element={user ? <Navigate to="/home" replace /> : <Login />} />
      <Route path="/home"    element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/xbox360" element={<PrivateRoute><Xbox360 /></PrivateRoute>} />
      <Route path="*"        element={<Navigate to="/" replace />} />
    </Routes>
  )
}
