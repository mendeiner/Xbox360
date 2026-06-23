import { createContext, useCallback, useContext, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { createFeedPost, createBatchFeedPost } from '../lib/social'

const LibraryAddBatchContext = createContext(null)

const CONSOLE_PATHS = ['/xbox360', '/ps2', '/ps3', '/snes', '/nsw']
const FLUSH_DELAY_MS = 2 * 60 * 1000

function storageKey(userId) {
  return `pending_feed_batch_${userId}`
}

function readBatch(userId) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]')
  } catch {
    return []
  }
}

function writeBatch(userId, items) {
  if (items.length) localStorage.setItem(storageKey(userId), JSON.stringify(items))
  else localStorage.removeItem(storageKey(userId))
}

export function LibraryAddBatchProvider({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  const timerRef = useRef(null)
  const wasOnConsolePathRef = useRef(null)

  const flush = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = null
    if (!user) return
    const items = readBatch(user.id)
    if (!items.length) return
    writeBatch(user.id, [])
    const post = items.length === 1
      ? createFeedPost(items[0].console, items[0].game_id, items[0].action, items[0].rating)
      : createBatchFeedPost(items)
    post.catch(() => {})
  }, [user])

  // Flush anything left over from a tab that was closed mid-batch.
  useEffect(() => {
    if (user) flush()
  }, [user, flush])

  useEffect(() => {
    const isOnConsolePath = CONSOLE_PATHS.includes(location.pathname)
    const wasOnConsolePath = wasOnConsolePathRef.current
    wasOnConsolePathRef.current = isOnConsolePath

    if (wasOnConsolePath === true && !isOnConsolePath) {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(flush, FLUSH_DELAY_MS)
    } else if (isOnConsolePath && timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [location.pathname, flush])

  const addToBatch = useCallback((consoleId, gameId, action, rating = null) => {
    if (!user) return
    const items = readBatch(user.id)
    const existing = items.find((item) => item.console === consoleId && item.game_id === gameId)
    if (existing) {
      existing.action = action
      existing.rating = rating
    } else {
      items.push({ console: consoleId, game_id: gameId, action, rating })
    }
    writeBatch(user.id, items)
  }, [user])

  return (
    <LibraryAddBatchContext.Provider value={{ addToBatch }}>
      {children}
    </LibraryAddBatchContext.Provider>
  )
}

export const useLibraryAddBatch = () => useContext(LibraryAddBatchContext)
