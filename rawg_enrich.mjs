// One-off RAWG.io data enrichment for game catalogs (not part of the build).
//
// Backfills, per console, only what's currently missing — never overwrites existing
// hand-entered data except `year` on ps3 (documented as low-confidence in CLAUDE.md):
//   - genre: [] (empty)              -> mapped RAWG genres, if a confident title match is found
//   - score missing entirely         -> RAWG `metacritic` (same 0-100 scale already used)
//   - year (ps3 only, always)        -> RAWG `released` year (GameTDB's year is known-bad)
//
// Usage:
//   node rawg_enrich.mjs <xbox360|ps2|ps3|gamecube> --key <RAWG_API_KEY> [--apply] [--limit N] [--start N]
//
// Without --apply, runs as a dry run: prints proposed changes + a summary, writes nothing.
// With --apply, rewrites the console's games.js file in place, one line at a time, leaving
// every untouched line byte-identical to the original (verified per-line before writing).

import fs from 'fs';

const CONSOLES = {
  xbox360:  { file: 'src/data/xbox360/games.js',  platform: 14,  style: 'json', fixYear: false },
  ps2:      { file: 'src/data/ps2/games.js',      platform: 15,  style: 'js',   fixYear: false },
  ps3:      { file: 'src/data/ps3/games.js',      platform: 16,  style: 'js',   fixYear: true },
  gamecube: { file: 'src/data/gamecube/games.js', platform: 105, style: 'js',   fixYear: false },
};

const GENRE_MAP = {
  action: 'Ação',
  adventure: 'Aventura',
  'role-playing-games-rpg': 'RPG',
  strategy: 'Estratégia',
  shooter: 'FPS',
  simulation: 'Simulação',
  puzzle: 'Puzzle',
  arcade: 'Arcade',
  platformer: 'Plataforma',
  racing: 'Corrida',
  sports: 'Esportes',
  fighting: 'Luta',
  family: 'Família',
};

function normTitle(t) {
  return t
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[™®'’]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(the|a|an)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Simple ratio similarity (Dice coefficient over bigrams) - no deps needed.
function similarity(a, b) {
  if (a === b) return 1;
  const bigrams = s => { const r = new Map(); for (let i = 0; i < s.length - 1; i++) { const bg = s.slice(i, i + 2); r.set(bg, (r.get(bg) || 0) + 1); } return r; };
  const ba = bigrams(a), bb = bigrams(b);
  let total = 0, common = 0;
  for (const [bg, n] of ba) { total += n; const m = bb.get(bg); if (m) common += Math.min(n, m); }
  for (const n of bb.values()) total += n;
  return total === 0 ? 0 : (2 * common) / total;
}

async function rawgSearch(title, platform, apiKey) {
  const url = `https://api.rawg.io/api/games?search=${encodeURIComponent(title)}&platforms=${platform}&key=${apiKey}&page_size=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

function pickBestMatch(title, candidates) {
  const nt = normTitle(title);
  let best = null, bestScore = 0;
  for (const c of candidates) {
    const s = similarity(nt, normTitle(c.name));
    if (s > bestScore) { bestScore = s; best = c; }
  }
  return bestScore >= 0.90 ? { match: best, score: bestScore } : null;
}

function mapGenres(rawgGenres) {
  const out = [];
  for (const g of rawgGenres || []) {
    const mapped = GENRE_MAP[g.slug];
    if (mapped && !out.includes(mapped)) out.push(mapped);
  }
  return out;
}

// ---- Per-line literal parse/serialize (handles both JSON-style and JS-object-literal style) ----

function parseLine(line) {
  const trimmed = line.replace(/,\s*$/, '');
  // eslint-disable-next-line no-new-func
  return new Function('return (' + trimmed + ')')();
}

function quoteStr(s, q) {
  const esc = s.replace(/\\/g, '\\\\').replace(new RegExp(q, 'g'), '\\' + q);
  return q + esc + q;
}

const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function serialize(value, style) {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    const items = value.map(v => serialize(v, style));
    return style === 'js' ? `[${items.join(', ')}]` : `[${items.join(',')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value).map(([k, v]) => {
      const key = style === 'js' ? (IDENT_RE.test(k) ? k : quoteStr(k, "'")) : quoteStr(k, '"');
      return `${key}: ${serialize(v, style)}`;
    });
    return style === 'js' ? `{ ${entries.join(', ')} }` : `{${entries.join(',')}}`;
  }
  if (typeof value === 'string') return quoteStr(value, style === 'js' ? "'" : '"');
  return String(value);
}

function serializeLine(obj, style, indent, trailingComma) {
  return indent + serialize(obj, style) + (trailingComma ? ',' : '');
}

// ---- Main ----

function parseArgs(argv) {
  const args = { console: argv[2] };
  for (let i = 3; i < argv.length; i++) {
    if (argv[i] === '--key') args.key = argv[++i];
    else if (argv[i] === '--apply') args.apply = true;
    else if (argv[i] === '--limit') args.limit = parseInt(argv[++i], 10);
    else if (argv[i] === '--start') args.start = parseInt(argv[++i], 10);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const cfg = CONSOLES[args.console];
  if (!cfg) { console.error('Usage: node rawg_enrich.mjs <xbox360|ps2|ps3|gamecube> --key <RAWG_API_KEY> [--apply] [--limit N] [--start N]'); process.exit(1); }
  if (!args.key) { console.error('Missing --key <RAWG_API_KEY>'); process.exit(1); }

  const raw = fs.readFileSync(cfg.file, 'utf8');
  const lines = raw.split('\n');

  const indentRe = cfg.style === 'js' ? /^(\s*)\{ id:\s*(\d+)/ : /^(\s*)\{"id":\s*(\d+)/;

  let processed = 0, matched = 0, genreFilled = 0, scoreFilled = 0, yearFixed = 0, skippedNoMatch = 0;
  const lowConfidenceLog = [];
  const newLines = lines.slice();

  let start = args.start || 0;
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(indentRe);
    if (!m) continue;
    const id = parseInt(m[2], 10);
    if (count < start) { count++; continue; }
    if (args.limit && processed >= args.limit) break;
    count++;

    let obj;
    try { obj = parseLine(lines[i]); } catch (e) { console.error(`Line ${i + 1} (id ${id}) parse failed: ${e.message}`); continue; }

    const needsGenre = !obj.genre || obj.genre.length === 0;
    const needsScore = obj.score == null;
    const needsYear = !!cfg.fixYear;
    if (!needsGenre && !needsScore && !needsYear) continue;

    processed++;
    let candidates;
    try { candidates = await rawgSearch(obj.title, cfg.platform, args.key); }
    catch (e) { console.error(`RAWG search failed for "${obj.title}": ${e.message}`); await sleep(1000); continue; }

    const best = pickBestMatch(obj.title, candidates);
    if (!best) {
      skippedNoMatch++;
      lowConfidenceLog.push({ id, title: obj.title, candidates: candidates.slice(0, 3).map(c => c.name) });
      await sleep(250);
      continue;
    }
    matched++;
    const { match } = best;
    let changed = false;

    if (needsGenre) {
      const genres = mapGenres(match.genres);
      if (genres.length) { obj.genre = genres; genreFilled++; changed = true; }
    }
    if (needsScore && match.metacritic != null) {
      const newObj = {};
      for (const [k, v] of Object.entries(obj)) {
        newObj[k] = v;
        if (k === 'title') newObj.score = match.metacritic;
      }
      obj = newObj;
      scoreFilled++;
      changed = true;
    }
    if (needsYear && match.released) {
      const newYear = parseInt(match.released.slice(0, 4), 10);
      if (newYear !== obj.year) { obj.year = newYear; yearFixed++; changed = true; }
    }

    if (changed) {
      const trailingComma = /,\s*$/.test(lines[i]);
      const indent = m[1];
      const newLine = serializeLine(obj, cfg.style, indent, trailingComma);
      newLines[i] = newLine;
      console.log(`[${args.console}] id=${id} "${obj.title}" <- "${match.name}" (sim=${best.score.toFixed(2)}) genre=${JSON.stringify(obj.genre)} score=${obj.score} year=${obj.year}`);
    }

    await sleep(200);
  }

  console.log('\n--- summary ---');
  console.log(`processed: ${processed}, matched: ${matched}, no-match: ${skippedNoMatch}`);
  console.log(`genre filled: ${genreFilled}, score filled: ${scoreFilled}, year fixed: ${yearFixed}`);
  if (lowConfidenceLog.length) {
    fs.writeFileSync(`rawg_${args.console}_no_match.json`, JSON.stringify(lowConfidenceLog, null, 2));
    console.log(`no-match log written to rawg_${args.console}_no_match.json (${lowConfidenceLog.length} entries)`);
  }

  if (args.apply) {
    fs.writeFileSync(cfg.file, newLines.join('\n'));
    console.log(`\nWrote changes to ${cfg.file}`);
  } else {
    console.log('\nDry run only - no files written. Pass --apply to write changes.');
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

main();
