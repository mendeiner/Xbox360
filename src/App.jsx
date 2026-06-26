import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { LibraryAddBatchProvider } from './contexts/LibraryAddBatchContext'
import AchievementToastContainer from './components/social/AchievementToastContainer'
import Login     from './pages/Login'

const Home      = lazy(() => import('./pages/Home'))
const Xbox360   = lazy(() => import('./pages/Xbox360'))
const PS2       = lazy(() => import('./pages/PS2'))
const PS3       = lazy(() => import('./pages/PS3'))
const SNES      = lazy(() => import('./pages/SNES'))
const NSW       = lazy(() => import('./pages/NSW'))
const GBA       = lazy(() => import('./pages/GBA'))
const Wii       = lazy(() => import('./pages/Wii'))
const PS4       = lazy(() => import('./pages/PS4'))
const N64       = lazy(() => import('./pages/N64'))
const GameCube  = lazy(() => import('./pages/GameCube'))
const N3DS      = lazy(() => import('./pages/N3DS'))
const Feed      = lazy(() => import('./pages/Feed'))
const Profile   = lazy(() => import('./pages/Profile'))
const Rankings  = lazy(() => import('./pages/Rankings'))
const Polls     = lazy(() => import('./pages/Polls'))

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
      <Suspense fallback={<Spinner />}>
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
          <Route path="/n64"       element={<N64 />} />
          <Route path="/gamecube"  element={<GameCube />} />
          <Route path="/3ds"       element={<N3DS />} />
          <Route path="/feed"      element={<PrivateRoute><Feed /></PrivateRoute>} />
          <Route path="/u/:username" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/rankings"  element={<PrivateRoute><Rankings /></PrivateRoute>} />
          <Route path="/polls"     element={<PrivateRoute><Polls /></PrivateRoute>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </LibraryAddBatchProvider>
  )
}
