import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { LibraryAddBatchProvider } from './contexts/LibraryAddBatchContext'
import AchievementToastContainer from './components/social/AchievementToastContainer'
import Login     from './pages/Login'
import Home      from './pages/Home'
import Xbox360   from './pages/Xbox360'
import PS2       from './pages/PS2'
import PS3       from './pages/PS3'
import SNES      from './pages/SNES'
import NSW       from './pages/NSW'
import GBA       from './pages/GBA'
import Wii       from './pages/Wii'
import PS4       from './pages/PS4'
import Feed      from './pages/Feed'
import Profile   from './pages/Profile'
import Rankings  from './pages/Rankings'
import Polls     from './pages/Polls'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/" replace />
}

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-1">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />

  return (
    <LibraryAddBatchProvider>
      {user && <AchievementToastContainer />}
      <Routes>
        <Route path="/"     element={user ? <Navigate to="/home" replace /> : <Login />} />
        <Route path="/home"      element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/xbox360"   element={<Xbox360 />} />
        <Route path="/ps2"       element={<PS2 />} />
        <Route path="/ps3"       element={<PS3 />} />
        <Route path="/snes"      element={<SNES />} />
        <Route path="/nsw"       element={<NSW />} />
        <Route path="/gba"       element={<GBA />} />
        <Route path="/wii"       element={<Wii />} />
        <Route path="/ps4"       element={<PS4 />} />
        <Route path="/feed"      element={<PrivateRoute><Feed /></PrivateRoute>} />
        <Route path="/u/:username" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/rankings"  element={<PrivateRoute><Rankings /></PrivateRoute>} />
        <Route path="/polls"     element={<PrivateRoute><Polls /></PrivateRoute>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </LibraryAddBatchProvider>
  )
}
