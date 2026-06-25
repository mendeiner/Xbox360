// Gaming-culture benchmark copy (plan Part B). There's no playtime/hours field anywhere in
// the schema (game_statuses only has boolean flags + rating + _year columns), so every
// reference here is framed in game *counts* against real, well-known franchise counts —
// never hours. Tiers must stay sorted ascending by `min`: `pick()` walks them in array order
// and keeps the last one the value clears, so an out-of-order array silently breaks ties.
function pick(tiers, value) {
  let result = tiers[0].line
  for (const tier of tiers) {
    if (value >= tier.min) result = tier.line
  }
  return typeof result === 'function' ? result(value) : result
}

// Press Start 2P (the pixel font every recap-pixel headline uses) falls back to a mismatched
// serif glyph for PT-BR diacritics on some uppercase letters (Ê, Ã) and silently drops others —
// verified by screenshotting "VOCÊ" vs "GÊNERO" side by side. Verdict headlines are ALL-CAPS
// pixel text, so strip diacritics there for one consistent look instead of that inconsistent
// per-character fallback. Body copy (lowercase, regular font) is unaffected and keeps accents.
export function deaccent(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function pickPixel(tiers, value) {
  return deaccent(pick(tiers, value))
}

export function gamesBeatenLine(n) {
  return pick([
    { min: 0, line: 'o ano tá só começando' },
    { min: 1, line: 'um, e tá valendo' },
    { min: 2, line: v => `${v} zerados, ritmo bom` },
    { min: 3, line: v => `${v} zerados — já dá pra fechar a trilogia original de Dark Souls` },
    { min: 5, line: v => `${v} zerados — mais que a trilogia inteira de Mass Effect` },
    { min: 9, line: v => `${v} zerados — cobre todos os numerados de Resident Evil` },
    { min: 15, line: v => `${v} zerados — passou da metade dos mainline de Zelda` },
    { min: 20, line: v => `${v}?! isso é o catálogo mainline de Zelda inteiro` },
    { min: 30, line: v => `${v}... isso já é lendário` },
  ], n)
}

export function achievementsLine(n) {
  return pick([
    { min: 1, line: 'sua primeira conquista do ano' },
    { min: 3, line: v => `${v} conquistas — já dá pra montar um pódio` },
    { min: 8, line: v => `${v} conquistas — o número de Badges de Ginásio de Kanto` },
    { min: 16, line: v => `${v} conquistas — dobrou Kanto` },
    { min: 30, line: v => `${v} conquistas — sala de troféus lotada` },
  ], n)
}

export function consolesTouchedLine(n) {
  return pick([
    { min: 1, line: 'fiel a uma única plataforma' },
    { min: 2, line: 'já é um cross-over' },
    { min: 4, line: 'geração múltipla, biblioteca múltipla' },
    { min: 6, line: 'praticamente um museu funcional' },
  ], n)
}

// FriendRankSlide's percentile line. Deliberately not framed as "TOP X%" — at the low end
// that inversion reads as bragging about a bad result ("TOP 100%"), which is backwards. The
// percentile itself is always coherent (bigger = better), so it carries the headline number;
// this only adds the tier-flavored line underneath.
export function friendRankLine(percentile) {
  return pick([
    { min: 0, line: 'temporada de rebuild — sobe ano que vem' },
    { min: 25, line: v => `melhor que ${v}% da galera, dá pra evoluir` },
    { min: 50, line: v => `melhor que ${v}% — saiu da fila do respawn` },
    { min: 80, line: v => `melhor que ${v}% — perto do topo do ranking` },
    { min: 100, line: 'ninguém zerou mais que você este ano' },
  ], percentile)
}

// VS slide year-over-year delta — framed as a level-up/farm-run beat, not a percentage alone.
export function vsDeltaLine(deltaPct, up) {
  if (up) {
    return pick([
      { min: 0, line: 'subiu de nível' },
      { min: 50, line: 'upgrade de tier' },
      { min: 100, line: 'isso é um New Game Plus' },
    ], deltaPct)
  }
  return pick([
    { min: 0, line: 'ano de farm, não de boss rush' },
    { min: 50, line: 'backlog ganhou essa rodada' },
  ], Math.abs(deltaPct))
}

// ── Verdict headlines (round 2) ─────────────────────────────────────────
// Per the grilling session: a bare number is a scoreboard, not a story. Every slide that can
// support one leads with a short ALL-CAPS statement about *what kind of player this makes you*
// — the number/covers underneath are the evidence, not the headline. Voice is deliberately
// mixed per the user ("you can use all of them, be creative"): zoeira/gíria, cocky arcade
// announcer, pure hype, dry one-liners — picked per tier, not one fixed tone for the whole
// feature.

export function gamesBeatenVerdict(n) {
  return pickPixel([
    { min: 0, line: 'O ANO TÁ SÓ COMEÇANDO' },
    { min: 1, line: 'VOCÊ ABRIU O JOGO' },
    { min: 3, line: 'PEGOU RITMO' },
    { min: 6, line: 'MÁQUINA DE ZERAR' },
    { min: 12, line: 'ISSO AQUI É FARM DE BOSS' },
    { min: 20, line: 'LENDA VIVA DO BACKLOG' },
  ], n)
}

export function metacriticVerdict(score) {
  return pickPixel([
    { min: 0, line: 'VOCÊ JOGA O QUE QUISER, NÃO O QUE MANDAM' },
    { min: 60, line: 'GOSTO RAZOÁVEL, SEM DRAMA' },
    { min: 80, line: 'VOCÊ JOGA O QUE O MUNDO APLAUDE' },
    { min: 90, line: 'SEU TIME É TOP DE CRÍTICA' },
  ], score)
}

export function completionistVerdict(pct) {
  return pickPixel([
    { min: 0, line: 'PLATINA QUANDO DÁ VONTADE' },
    { min: 30, line: 'CAÇADOR DE PLATINA EM TREINAMENTO' },
    { min: 60, line: 'PLATINA É O MÍNIMO PRA VOCÊ' },
  ], pct)
}

export function platformLoyaltyVerdict(pct) {
  return pickPixel([
    { min: 0, line: 'VOCÊ CIRCULA ENTRE PLATAFORMAS' },
    { min: 50, line: 'TEM UMA CASA, MAS PASSEIA' },
    { min: 80, line: 'LEALDADE DE DAY ONE' },
  ], pct)
}

export function consolesVerdict(n) {
  return pickPixel([
    { min: 1, line: 'FIEL A UMA SÓ PLATAFORMA' },
    { min: 2, line: 'JOGADOR MULTI-PLATAFORMA' },
    { min: 4, line: 'SEU QUARTO É UM MUSEU' },
  ], n)
}

export function friendRankVerdict(percentile) {
  return pickPixel([
    { min: 0, line: 'TEMPORADA DE REBUILD' },
    { min: 25, line: 'SUBINDO NO RANKING' },
    { min: 50, line: 'ACIMA DA MÉDIA DA GALERA' },
    { min: 80, line: 'TOP DA LISTA' },
    { min: 100, line: 'NINGUÉM TE ALCANÇA' },
  ], percentile)
}

export function achievementsVerdict(n) {
  return pickPixel([
    { min: 1, line: 'PRIMEIROS TROFÉUS NA ESTANTE' },
    { min: 3, line: 'CAÇADOR DE CONQUISTAS' },
    { min: 8, line: 'SALA DE TROFÉUS LOTADA' },
  ], n)
}

export function continueVerdict(n) {
  return pickPixel([
    { min: 0, line: 'QUASE SEM PENDÊNCIA' },
    { min: 3, line: 'SUA FILA DE PAUSADOS' },
    { min: 8, line: 'FILA DE CONTINUE INTERMINÁVEL' },
  ], n)
}

export function wallVerdict(n) {
  return pickPixel([
    { min: 0, line: 'O COMEÇO DA SUA COLEÇÃO' },
    { min: 10, line: 'UMA ESTANTE RESPEITÁVEL' },
    { min: 25, line: 'HALL DA FAMA DE VERDADE' },
  ], n)
}

export function busiestMonthVerdict(count) {
  return pickPixel([
    { min: 0, line: 'TEVE SEU MOMENTO NO ANO' },
    { min: 3, line: 'UM MÊS INTEIRO NO MODO HARDCORE' },
    { min: 5, line: 'ISSO FOI UM EVENTO SAZONAL' },
  ], count)
}

export function topGenreVerdict(genre) {
  return deaccent(`${genre.toUpperCase()} É O SEU MAIN`)
}
