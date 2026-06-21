// Shared archive.org download-link helpers, parameterized by a console's `partIds` map
// (see registry.js) instead of a hardcoded slug table.

export function buildDlEntries(dl) {
  if (!dl) return []
  if (dl.discs) return dl.discs.map((d, i) => ({ part: d.part, file: d.file, disc: i + 1 }))
  if (dl.files) return dl.files.map((f, i) => ({ part: dl.part, file: f, disc: i + 1 }))
  return [{ part: dl.part, file: dl.file, disc: 0 }]
}

export function dlFileUrl(partIds, part, file) {
  const id = partIds[part]
  if (!id || !file) return null
  return `https://archive.org/download/${id}/${encodeURIComponent(file)}`
}

export function dlPageUrl(partIds, part) {
  const id = partIds[part]
  return id ? `https://archive.org/details/${id}` : null
}

// First resolvable download link for a game's `dl` field (used by the compact card view).
export function dlLink(dl, partIds) {
  if (!dl) return null
  const entries = buildDlEntries(dl)
  const first = entries[0]
  if (!first) return null
  return dlFileUrl(partIds, first.part, first.file)
}

export function coverSrc(game, console) {
  // Most consoles' cover files are named by the value in `covers` (e.g. Xbox 360's hex
  // title-id). Consoles flagged `coversById` (PS2) instead name cover files by game id directly.
  const key = console.coversById ? game.id : console.covers[game.id]
  if (!key) return null
  return `${console.coverPrefix}/${key}.webp`
}

// Cover art is wide box-art (front cover + spine); anchoring crops to the right shows the
// front art instead of slicing it in half. SNES covers are mirrored (spine on the right).
export function coverObjectPosition(console) {
  return console?.id === 'snes' ? 'left center' : 'right center'
}

// Standard Metacritic color convention: green ≥75, yellow 50-74, red <50.
export function metacriticCls(score) {
  if (score >= 75) return 'bg-green-600 text-white'
  if (score >= 50) return 'bg-yellow-500 text-black'
  return 'bg-red-600 text-white'
}

export function typeLabel(console, type) {
  const [label] = console.typeMap[type] ?? [type]
  return label
}

export function typeBadge(console, type) {
  return console.typeMap[type] ?? [type, 'text-gray-400 bg-gray-400/10 border-gray-400/20']
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 }
}

export function accentRgba(console, alpha = 1, darken = 1) {
  const { r, g, b } = hexToRgb(console.accentColor)
  return `rgba(${Math.round(r * darken)}, ${Math.round(g * darken)}, ${Math.round(b * darken)}, ${alpha})`
}

// Mixes the accent color toward white — for text/icons on dark backgrounds, where the raw
// (often dark) brand hex reads too low-contrast (e.g. PS2's #003791 navy).
export function accentLight(console, amount = 0.55) {
  const { r, g, b } = hexToRgb(console.accentColor)
  const mix = c => Math.round(c + (255 - c) * amount)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}
