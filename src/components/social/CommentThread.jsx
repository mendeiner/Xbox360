import { useState } from 'react'

export default function CommentThread({ comments, onAdd, currentUserId }) {
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!body.trim() || posting) return
    setPosting(true)
    try {
      await onAdd(body.trim())
      setBody('')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="space-y-2">
      {comments.map(c => (
        <div key={c.id} className="flex gap-2 text-[12px]">
          <span className="font-bold text-white shrink-0">{c.profiles?.display_name || c.profiles?.username}</span>
          <span className="text-gray-400 break-words">{c.body}</span>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
        <input
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={currentUserId ? 'Escreva um comentário...' : 'Faça login para comentar'}
          disabled={!currentUserId || posting}
          className="flex-1 bg-[#0a0e1a] border border-[#222b4a] px-3 py-1.5 text-[12px] text-white focus:border-social outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!currentUserId || posting || !body.trim()}
          className="text-[11px] font-black uppercase px-3 py-1.5 bg-social text-white disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
