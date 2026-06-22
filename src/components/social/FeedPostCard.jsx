import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getConsole } from '../../consoles/registry'
import { coverSrc, coverObjectPosition } from '../../consoles/dl'
import { ACTION_LABEL, getComments, addComment } from '../../lib/social'
import ReactionPicker from './ReactionPicker'
import CommentThread from './CommentThread'

export default function FeedPostCard({ post, currentUserId, compact = false }) {
  const isBatch = post.action === 'added_games'
  const console_ = isBatch ? null : getConsole(post.console)
  const game = isBatch ? null : console_?.games.find(g => g.id === post.game_id)

  // counts/mine come pre-batched from getFeedPosts (reactionCounts/myReaction) — no
  // per-card round-trip needed.
  const [reactions, setReactions] = useState({ counts: post.reactionCounts || {}, mine: post.myReaction ?? null })
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [commentCount, setCommentCount] = useState(post.commentCount || 0)

  async function toggleComments() {
    if (!commentsOpen) {
      const data = await getComments(post.id).catch(() => [])
      setComments(data)
    }
    setCommentsOpen(v => !v)
  }

  async function handleAddComment(body) {
    const comment = await addComment(post.id, body)
    setComments(prev => [...prev, { ...comment, profiles: { username: 'você' } }])
    setCommentCount(c => c + 1)
  }

  if (!isBatch && !game) return null

  const username = post.profiles?.display_name || post.profiles?.username

  const interactions = !compact && (
    <div className="flex items-center gap-3 mt-4">
      <ReactionPicker
        postId={post.id}
        userId={currentUserId}
        counts={reactions.counts}
        mine={reactions.mine}
        onChange={reaction => setReactions(r => recomputeCounts(r, reaction))}
      />
      <button onClick={toggleComments} className="text-[11px] text-gray-500 hover:text-white font-bold uppercase tracking-wide">
        {commentCount} {commentCount === 1 ? 'comentário' : 'comentários'}
      </button>
    </div>
  )

  if (isBatch) {
    const items = post.items || []
    const visible = items.slice(0, 5)
    const overflow = items.length - visible.length

    return (
      <div className="bg-social-ink border border-[#222b4a]">
        <div className="flex gap-5 p-5">
          <div className="flex shrink-0">
            {visible.map((item, i) => {
              const itemConsole = getConsole(item.console)
              const itemGame = itemConsole?.games.find(g => g.id === item.game_id)
              return (
                <img
                  key={i}
                  src={(itemGame && coverSrc(itemGame, itemConsole)) || undefined}
                  alt=""
                  className="w-12 h-[68px] object-cover bg-[#0a0a0a] border-2 border-social-ink"
                  style={{ objectPosition: coverObjectPosition(itemConsole), marginLeft: i > 0 ? '-24px' : 0 }}
                  onError={e => { e.target.style.display = 'none' }}
                />
              )
            })}
            {overflow > 0 && (
              <div className="w-12 h-[68px] flex items-center justify-center bg-[#0a0a0a] border-2 border-social-ink text-[11px] font-bold text-gray-400" style={{ marginLeft: '-24px' }}>
                +{overflow}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base text-white leading-snug">
              <Link to={`/u/${post.profiles?.username}`} className="font-black hover:text-social">{username}</Link>
              <span className="text-gray-400"> adicionou </span>
              <span className="font-black">{items.length} jogos</span>
            </p>
            <p className="text-[11px] text-gray-500 font-semibold mt-1.5 uppercase tracking-wide">
              {new Date(post.created_at).toLocaleDateString('pt-BR')}
            </p>

            {interactions}
          </div>
        </div>

        {commentsOpen && (
          <div className="border-t border-[#222b4a] px-4 py-3">
            <CommentThread comments={comments} onAdd={handleAddComment} currentUserId={currentUserId} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-social-ink border border-[#222b4a]">
      <div className="flex gap-5 p-5">
        <img
          src={coverSrc(game, console_) || undefined}
          alt=""
          className="w-20 h-[110px] object-cover bg-[#0a0a0a] shrink-0"
          style={{ objectPosition: coverObjectPosition(console_) }}
          onError={e => { e.target.style.display = 'none' }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-base text-white leading-snug">
            <Link to={`/u/${post.profiles?.username}`} className="font-black hover:text-social">{username}</Link>
            <span className="text-gray-400"> {ACTION_LABEL[post.action]} </span>
            <span className="font-black">{game.title}</span>
          </p>
          <p className="text-[11px] text-gray-500 font-semibold mt-1.5 uppercase tracking-wide">
            {console_.label} · {new Date(post.created_at).toLocaleDateString('pt-BR')}
            {post.rating ? ` · ★ ${post.rating}` : ''}
          </p>

          {interactions}
        </div>
      </div>

      {commentsOpen && (
        <div className="border-t border-[#222b4a] px-4 py-3">
          <CommentThread comments={comments} onAdd={handleAddComment} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  )
}

function recomputeCounts(prev, newReaction) {
  const counts = { ...prev.counts }
  if (prev.mine) counts[prev.mine] = Math.max(0, (counts[prev.mine] || 1) - 1)
  if (newReaction) counts[newReaction] = (counts[newReaction] || 0) + 1
  return { counts, mine: newReaction }
}
