import { useState, useEffect, useCallback } from 'react'
import { getUnreadCount, getNotifications, markAllRead } from '../lib/social'

const POLL_MS = 45000

export function useNotifications(userId) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])

  const refresh = useCallback(() => {
    if (!userId) return
    getUnreadCount(userId).then(setUnreadCount).catch(() => {})
  }, [userId])

  useEffect(() => {
    if (!userId) return
    refresh()
    const interval = setInterval(refresh, POLL_MS)
    const onFocus = () => refresh()
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [userId, refresh])

  async function open() {
    if (!userId) return
    const data = await getNotifications(userId)
    setNotifications(data)
  }

  async function markRead() {
    if (!userId) return
    await markAllRead(userId)
    setUnreadCount(0)
  }

  return { unreadCount, notifications, open, markRead }
}
