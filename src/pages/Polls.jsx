import { useState, useEffect, useCallback } from 'react'
import Nav from '../components/Nav'
import UsersList from '../components/social/UsersList'
import PollResultCard from '../components/social/PollResultCard'
import { useAuth } from '../contexts/AuthContext'
import { useFriends } from '../hooks/useFriends'
import { getClosedPolls, getPollResults } from '../lib/polls'

// History of every poll (yours + friends') that has finished its 1-week voting window —
// the site-wide counterpart to PollStrip's "open right now" strip on the home feed.
export default function Polls() {
  const { user } = useAuth()
  const { friends, loading: friendsLoading } = useFriends(user?.id)
  const [polls, setPolls] = useState([])
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!user) return
    setLoading(true)
    const userIds = [user.id, ...friends.map(f => f.id)]
    getClosedPolls(userIds, user.id).then(async ps => {
      const res = {}
      await Promise.all(ps.map(async p => { res[p.id] = await getPollResults(p.id) }))
      setPolls(ps)
      setResults(res)
      setLoading(false)
    })
  }, [user, friends])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-social-bg">
      <Nav />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-[220px_1fr] gap-6">
          <UsersList friends={friends} loading={friendsLoading} viewerId={user?.id} />

          <main className="min-w-0">
            <h1 className="text-[clamp(2rem,5vw,3rem)] font-black uppercase leading-[0.95] tracking-[-0.03em] mb-1">
              Votações <span className="text-social">Encerradas</span>
            </h1>
            <p className="text-gray-500 text-sm font-medium mb-8">
              Resultado final das votações "qual jogar agora?" — suas e dos seus amigos.
            </p>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-36 bg-[#10162a] animate-pulse" />
                ))}
              </div>
            ) : polls.length === 0 ? (
              <p className="text-gray-600 text-sm">Nenhuma votação encerrada ainda.</p>
            ) : (
              <div className="space-y-3">
                {polls.map(poll => (
                  <PollResultCard key={poll.id} poll={poll} results={results[poll.id]} showCreator />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
