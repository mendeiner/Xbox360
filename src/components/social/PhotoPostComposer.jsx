import { useState } from 'react'
import { resizeImageToWebp } from '../../lib/cropImage'
import { uploadFeedPhotos } from '../../lib/db'
import { createPhotoPost } from '../../lib/social'

const MAX_PHOTOS = 4

export default function PhotoPostComposer({ userId, onCancel, onPosted }) {
  const [photos, setPhotos] = useState([]) // [{ file, previewUrl }]
  const [caption, setCaption] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState(null)

  function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    const room = MAX_PHOTOS - photos.length
    const next = files.slice(0, room).map(file => ({ file, previewUrl: URL.createObjectURL(file) }))
    setPhotos(prev => [...prev, ...next])
  }

  function removePhoto(i) {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[i].previewUrl)
      return prev.filter((_, idx) => idx !== i)
    })
  }

  async function handlePost() {
    if (!photos.length || !userId) return
    setPosting(true)
    setError(null)
    try {
      const blobs = await Promise.all(photos.map(p => resizeImageToWebp(p.file)))
      const urls = await uploadFeedPhotos(userId, blobs)
      const post = await createPhotoPost(urls, caption.trim() || null)
      onPosted(post)
    } catch {
      setError('Não foi possível publicar a foto. Tente novamente.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#0c1226] border border-[#222b4a] w-full max-w-md">
        <div className="px-4 py-3 border-b border-[#222b4a]">
          <h2 className="text-sm font-black uppercase tracking-wide">Compartilhar foto</h2>
        </div>

        <div className="p-4 space-y-4">
          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {photos.map((p, i) => (
                <div key={p.previewUrl} className="relative aspect-square">
                  <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    disabled={posting}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black border border-[#222b4a] text-white text-[11px] font-black flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < MAX_PHOTOS && (
            <label className="block border border-dashed border-[#222b4a] text-center py-4 text-[11px] font-black uppercase tracking-wide text-gray-400 hover:text-social hover:border-social/40 cursor-pointer">
              {photos.length === 0 ? 'Escolher fotos' : 'Adicionar mais'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={posting} />
            </label>
          )}

          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Escreva uma legenda (opcional)"
            disabled={posting}
            className="w-full bg-[#161d35] border border-[#222b4a] px-3 py-2 text-sm text-white placeholder:text-gray-600 resize-none focus:outline-none focus:border-social/60"
          />

          {error && <p className="text-[11px] text-red-400 font-semibold">{error}</p>}
        </div>

        <div className="px-4 py-3 border-t border-[#222b4a] flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={posting}
            className="px-3 py-1.5 text-xs font-black uppercase text-gray-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handlePost}
            disabled={posting || !photos.length}
            className="px-3 py-1.5 text-xs font-black uppercase bg-social text-white disabled:opacity-50"
          >
            {posting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  )
}
