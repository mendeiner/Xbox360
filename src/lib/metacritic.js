import { readyConsoles } from '../consoles/registry'

const ARTICLE_RE = /^(the|a|an)\s+/
const PUNCT_RE = /[^a-z0-9 ]/g
const SPACE_RE = /\s+/g

// Same normalization used to backfill scores from the source spreadsheet — collapses
// case/punctuation/leading-article differences so the same game on two consoles dedupes.
function normalizeTitle(title) {
  return title
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(PUNCT_RE, ' ')
    .replace(SPACE_RE, ' ')
    .trim()
    .replace(ARTICLE_RE, '')
}

// { byConsole: { [consoleId]: [{ game, console }] }, overall: [{ game, console }] }
// Both lists are sorted by score desc; `overall` dedupes same-title games across consoles,
// keeping whichever console's copy scored highest (registry order breaks ties).
export function getMetacriticRankings() {
  const consoles = readyConsoles()
  const byConsole = {}
  const best = new Map()

  for (const console of consoles) {
    const rows = console.games
      .filter(g => g.score != null)
      .map(game => ({ game, console }))
      .sort((a, b) => b.game.score - a.game.score)
    if (rows.length > 0) byConsole[console.id] = rows

    for (const row of rows) {
      const key = normalizeTitle(row.game.title)
      const current = best.get(key)
      if (!current || row.game.score > current.game.score) best.set(key, row)
    }
  }

  const overall = [...best.values()].sort((a, b) => b.game.score - a.game.score)
  return { byConsole, overall }
}
