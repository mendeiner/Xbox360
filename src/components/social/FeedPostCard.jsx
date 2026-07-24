import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getConsole } from '../../consoles/registry'
import { coverSrc, coverObjectPosition } from '../../consoles/dl'
import { ACTION_LABEL, addComment, deletePost } from '../../lib/social'
import ReactionPicker from './ReactionPicker'
import CommentThread from './CommentThread'

export default function FeedPostCard({ post, currentUserId, compact = false, onDeleted }) {
  const isBatch = post.action === 'added_games'
  const isPhoto = post.action === 'photo'
  const console_ = (isBatch || isPhoto) ? null : getConsole(post.console)
  const game = (isBatch || isPhoto) ? null : console_?.games?.find(g => g.id === post.game_id)

  // counts/mine come pre-batched from getFeedPosts (reactionCounts/myReaction) — no
  // per-card round-trip needed.
  const [reactions, setReactions] = useState({ counts: post.reactionCounts || {}, mine: post.myReaction ?? null })
  const [comments, setComments] = useState(post.comments || [])
  const [composerOpen, setComposerOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showList, setShowList] = useState(false)

  const canDelete = !compact && currentUserId && post.user_id === currentUserId

  async function handleDelete() {
    if (deleting || !window.confirm('Excluir esta publicação do feed?')) return
    setDeleting(true)
    try {
      await deletePost(post.id)
      onDeleted?.(post.id)
    } catch {
      setDeleting(false)
    }
  }

  const deleteButton = canDelete && (
    <button
      onClick={handleDelete}
      disabled={deleting}
      title="Excluir publicação"
      className="shrink-0 text-[11px] font-bold text-gray-600 hover:text-red-500 uppercase tracking-wide disabled:opacity-50"
    >
      {deleting ? '...' : 'Excluir'}
    </button>
  )

  async function handleAddComment(body) {
    const comment = await addComment(post.id, body)
    setComments(prev => [...prev, { ...comment, profiles: { username: 'você' } }])
  }

  if (!isBatch && !isPhoto && !game) return null

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
      {comments.length > 0 && (
        <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">
          {comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}
        </span>
      )}
      <button onClick={() => setComposerOpen(v => !v)} className="text-[11px] text-gray-500 hover:text-white font-bold uppercase tracking-wide">
        Comentar
      </button>
    </div>
  )

  const commentsBlock = (comments.length > 0 || composerOpen) && (
    <div className="border-t border-[#222b4a] px-4 py-3">
      <CommentThread comments={comments} onAdd={handleAddComment} currentUserId={currentUserId} showForm={composerOpen} />
    </div>
  )

  if (isPhoto) {
    const photos = post.photo_urls || []
    return (
      <div className="bg-social-ink border border-[#222b4a]">
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-base text-white leading-snug">
              <Link to={`/u/${post.profiles?.username}`} className="font-black hover:text-social">{username}</Link>
              <span className="text-gray-400"> compartilhou uma foto</span>
            </p>
            {deleteButton}
          </div>
          <p className="text-[11px] text-gray-500 font-semibold mt-1.5 uppercase tracking-wide">
            {new Date(post.created_at).toLocaleDateString('pt-BR')}
          </p>
          {post.caption && <p className="text-sm text-gray-300 mt-3 whitespace-pre-wrap">{post.caption}</p>}
        </div>

        {photos.length === 1 && (
          <img src={photos[0]} alt="" className="w-full max-h-[600px] object-contain bg-[#0a0a0a]" />
        )}

        {photos.length > 1 && (
          <div className="grid grid-cols-2 gap-0.5">
            {photos.map((url, i) => (
              <img key={i} src={url} alt="" className="w-full aspect-square object-cover bg-[#0a0a0a]" />
            ))}
          </div>
        )}

        <div className="p-5">
          {interactions}
        </div>

        {commentsBlock}
      </div>
    )
  }

  if (isBatch) {
    const items = post.items || []
    const games = items
      .map(item => {
        const c = getConsole(item.console)
        return { c, g: c?.games?.find(g => g.id === item.game_id) }
      })
      .filter(x => x.g)
    const visible = games.slice(0, 5)
    const overflow = games.length - visible.length
    // Tap (mobile) or hover (desktop, via `group`) reveals the titles that were added.
    const toggle = () => setShowList(v => !v)

    return (
      <div className="bg-social-ink border border-[#222b4a]">
        <div className="group flex gap-3 p-3">
          <button type="button" onClick={toggle} aria-label="Ver jogos adicionados" className="flex shrink-0 cursor-pointer">
            {visible.map(({ c, g }, i) => (
              <img
                key={i}
                src={coverSrc(g, c) || undefined}
                alt=""
                className="w-8 h-11 object-cover bg-[#0a0a0a] border-2 border-social-ink"
                style={{ objectPosition: coverObjectPosition(c), marginLeft: i > 0 ? '-16px' : 0 }}
                onError={e => { e.target.style.display = 'none' }}
              />
            ))}
            {overflow > 0 && (
              <div className="w-8 h-11 flex items-center justify-center bg-[#0a0a0a] border-2 border-social-ink text-[10px] font-bold text-gray-400" style={{ marginLeft: '-16px' }}>
                +{overflow}
              </div>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-white leading-snug">
                <Link to={`/u/${post.profiles?.username}`} className="font-black hover:text-social">{username}</Link>
                <span className="text-gray-400"> adicionou </span>
                <button type="button" onClick={toggle} className="font-black hover:text-social cursor-pointer">{games.length} jogos</button>
              </p>
              {deleteButton}
            </div>
            <p className="text-[10px] text-gray-500 font-semibold mt-1 uppercase tracking-wide">
              {new Date(post.created_at).toLocaleDateString('pt-BR')}
            </p>

            <ul className={(showList ? 'block ' : 'hidden ') + 'lg:group-hover:block mt-2 space-y-0.5'}>
              {games.map(({ c, g }, i) => (
                <li key={i} className="text-[11px] text-gray-300 truncate">
                  <span className="text-gray-500">{c.label}</span> · {g.title}
                </li>
              ))}
            </ul>

            {interactions}
          </div>
        </div>

        {commentsBlock}
      </div>
    )
  }

  return (
    <div className="bg-social-ink border border-[#222b4a]">
      <div className="flex gap-3 p-3">
        <img
          src={coverSrc(game, console_) || undefined}
          alt=""
          className="w-12 h-[68px] object-cover bg-[#0a0a0a] shrink-0"
          style={{ objectPosition: coverObjectPosition(console_) }}
          onError={e => { e.target.style.display = 'none' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-white leading-snug">
              <Link to={`/u/${post.profiles?.username}`} className="font-black hover:text-social">{username}</Link>
              <span className="text-gray-400"> {ACTION_LABEL[post.action]} </span>
              <span className="font-black">{game.title}</span>
            </p>
            {deleteButton}
          </div>
          <p className="text-[10px] text-gray-500 font-semibold mt-1 uppercase tracking-wide">
            {console_.label} · {new Date(post.created_at).toLocaleDateString('pt-BR')}
            {post.rating ? ` · ★ ${post.rating}` : ''}
          </p>

          {interactions}
        </div>
      </div>

      {commentsBlock}
    </div>
  )
}

function recomputeCounts(prev, newReaction) {
  const counts = { ...prev.counts }
  if (prev.mine) counts[prev.mine] = Math.max(0, (counts[prev.mine] || 1) - 1)
  if (newReaction) counts[newReaction] = (counts[newReaction] || 0) + 1
  return { counts, mine: newReaction }
}
