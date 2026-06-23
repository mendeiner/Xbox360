import { useConsolePage, useDragScroll } from '../consoles/useConsolePage'
import { coverSrc } from '../consoles/dl'
import GameCard from '../components/xbox360/GameCard'
import GameModal from '../components/xbox360/GameModal'
import Sidebar from '../components/xbox360/Sidebar'
import Nav from '../components/Nav'
import { useState } from 'react'

const CONSOLE_ID = 'ps2'

// ─── Curated rows ──────────────────────────────────────────────────────────────
const FEATURED = [
  'Grand Theft Auto', 'God of War', 'Shadow of the Colossus', 'Ico', 'Final Fantasy X',
  'Kingdom Hearts', 'Metal Gear Solid', 'Resident Evil 4', 'Silent Hill 2', 'Devil May Cry',
  'Gran Turismo', 'Ratchet & Clank', 'Jak and Daxter', 'Tekken 5', 'Okami',
]

const ROWS = [
  { id:'destaque',  title:'Em Destaque',     filter: g => FEATURED.some(t => g.title.includes(t)) },
  { id:'eyetoy',    title:'EyeToy',          filter: g => g.camera === true },
  { id:'fps',       title:'FPS & TPS',       filter: g => (g.genre||[]).includes('FPS') || (g.genre||[]).includes('TPS') },
  { id:'rpg',       title:'RPG',             filter: g => (g.genre||[]).includes('RPG') || (g.genre||[]).includes('JRPG') },
  { id:'acao',      title:'Ação & Aventura', filter: g => ((g.genre||[]).includes('Ação') || (g.genre||[]).includes('Aventura')) && !(g.genre||[]).includes('FPS') },
  { id:'terror',    title:'Terror',          filter: g => (g.genre||[]).includes('Terror') },
  { id:'furtivo',   title:'Furtivo & Tático',filter: g => (g.genre||[]).includes('Furtivo') || (g.genre||[]).includes('Tático') },
  { id:'luta',      title:'Luta',            filter: g => (g.genre||[]).includes('Luta') },
  { id:'tiro',      title:'Tiro',            filter: g => (g.genre||[]).includes('Tiro') },
  { id:'plataforma',title:'Plataforma',      filter: g => (g.genre||[]).includes('Plataforma') },
  { id:'corrida',   title:'Corrida',         filter: g => (g.genre||[]).includes('Corrida') },
  { id:'esportes',  title:'Esportes',        filter: g => (g.genre||[]).includes('Esportes') },
  { id:'estrategia',title:'Estratégia',      filter: g => (g.genre||[]).includes('Estratégia') },
  { id:'puzzle',    title:'Puzzle',          filter: g => (g.genre||[]).includes('Puzzle') },
  { id:'familia',   title:'Família & Comédia',filter: g => (g.genre||[]).includes('Família') || (g.genre||[]).includes('Comédia') },
  { id:'simulacao', title:'Simulação',       filter: g => (g.genre||[]).includes('Simulação') },
  { id:'arcadegen', title:'Estilo Arcade',   filter: g => (g.genre||[]).includes('Arcade') },
  { id:'musica',    title:'Música & Ritmo',  filter: g => (g.genre||[]).includes('Música') || (g.genre||[]).includes('Ritmo') },
  { id:'ano00',     title:'2000 – 2002',     filter: g => g.year >= 2000 && g.year <= 2002 },
  { id:'ano03',     title:'2003 – 2005',     filter: g => g.year >= 2003 && g.year <= 2005 },
  { id:'ano06',     title:'2006+',           filter: g => g.year >= 2006 },
]

// ─── Row scroll strip ─────────────────────────────────────────────────────────
function RowStrip({ games, statuses, onStatusChange, onOpen }) {
  const ref = useDragScroll()
  return (
    <div ref={ref} className="flex gap-2.5 overflow-x-auto px-4 pb-3 pt-1 scrollbar-none select-none" style={{ cursor: 'grab' }}>
      {games.map(g => (
        <GameCard key={g.id} game={g} consoleId={CONSOLE_ID} status={statuses[g.id] || {}} onStatusChange={onStatusChange} onClick={g2 => onOpen(games, g2)} />
      ))}
    </div>
  )
}

// ─── Collection mini-card ─────────────────────────────────────────────────────
function MiniCard({ game, console: console_, status, onClick }) {
  const cover  = coverSrc(game, console_)
  const border =
    status.cem_porcento ? 'border-yellow-500' :
    status.zerado       ? 'border-blue-600'   :
    status.joguei       ? 'border-[#003791]'  :
    status.jogando      ? 'border-teal-600'   :
    status.quero        ? 'border-purple-600' : 'border-transparent'

  return (
    <div className="flex-shrink-0 cursor-pointer group" onClick={() => onClick(game)}>
      <div className={`relative w-[70px] h-[100px] rounded-md bg-[#1a1a1a] border-2 overflow-hidden ${border}
        transition-transform duration-150 group-hover:-translate-y-0.5`}>
        <span className="absolute inset-0 flex items-center justify-center p-1 text-[8px] text-gray-600 text-center leading-tight z-0">
          {game.title}
        </span>
        {cover && (
          <img src={cover} alt="" loading="lazy"
            className="absolute inset-0 w-full h-full object-cover z-10"
            style={{ objectPosition: 'right center' }}
            onError={e => { e.target.style.display = 'none' }} />
        )}
      </div>
      <p className="mt-1 text-[9px] text-gray-500 text-center w-[70px] truncate">{game.title}</p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PS2() {
  const {
    console: console_,
    statuses, loading,
    search, setSearch,
    inc, exc, toggleInc, toggleExc, clearAll,
    isGrid, filteredGames, collectionGames, stats,
    handleStatusChange,
    openGame, closeGame, goPrev, goNext,
    selected, selectedIndex, selectedList,
  } = useConsolePage(CONSOLE_ID)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const collRef = useDragScroll()

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Nav />

      <Sidebar
        special={console_.specialFilters}
        groups={console_.filterGroups}
        accentColor={console_.accentColor}
        inc={inc} exc={exc}
        onInc={toggleInc} onExc={toggleExc}
        onClearAll={clearAll}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="md:ml-[200px]">

        {/* Sticky sub-header */}
        <div className="sticky top-[57px] z-30 bg-[#0f0f0f]/95 backdrop-blur border-b border-[#1e1e1e] px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            <div className="hidden md:flex items-center gap-2 flex-shrink-0 text-[#5e87d1] font-black text-[15px] tracking-tight">
              <svg viewBox="0 0 32 32" width="26" height="26" fill="none">
                <circle cx="16" cy="16" r="15" fill="#003791"/>
                <circle cx="16" cy="16" r="6" fill="none" stroke="white" strokeWidth="2"/>
                <circle cx="16" cy="16" r="2" fill="white"/>
              </svg>
              PS2
            </div>

            <div className="relative flex-1">
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar jogos..."
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-full px-4 py-2.5 text-[14px] font-medium outline-none focus:border-[#5e87d1] transition-colors placeholder-gray-600 text-white"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-lg leading-none">
                  ×
                </button>
              )}
            </div>

            <span className="text-[11px] text-gray-600 font-semibold flex-shrink-0 whitespace-nowrap">
              {filteredGames.length.toLocaleString('pt-BR')} jogos
            </span>
          </div>
        </div>

        {/* Collection strip */}
        {collectionGames.length > 0 && (
          <div className="px-4 pt-4 pb-0">
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-gray-600 mb-2 px-1">Minha Coleção</p>
            <div ref={collRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-none select-none" style={{ cursor: 'grab' }}>
              {collectionGames.map(g => (
                <MiniCard key={g.id} game={g} console={console_} status={statuses[g.id] || {}} onClick={g2 => openGame(collectionGames, g2)} />
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="pb-16">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-[#5e87d1] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-600">
              <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span className="font-bold text-sm">Nenhum jogo encontrado</span>
              <button onClick={() => { setSearch(''); clearAll() }} className="text-xs text-[#5e87d1] hover:text-white transition-colors">
                Limpar filtros
              </button>
            </div>
          ) : isGrid ? (
            <div className="grid gap-2.5 p-4 pt-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
              {filteredGames.map(g => (
                <GameCard key={g.id} game={g} consoleId={CONSOLE_ID} status={statuses[g.id] || {}} onStatusChange={handleStatusChange} onClick={g2 => openGame(filteredGames, g2)} gridMode />
              ))}
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {(() => {
                return ROWS.map(row => {
                  const games = console_.games.filter(row.filter)
                  if (!games.length) return null
                  return (
                    <section key={row.id}>
                      <div className="flex items-center gap-3 px-4 mb-2">
                        <h3 className="text-[18px] font-black tracking-tight border-l-[3px] border-[#003791] pl-2.5 leading-none">{row.title}</h3>
                        <span className="text-[11px] text-gray-600 bg-[#1e1e1e] border border-[#2a2a2a] rounded-full px-2.5 py-0.5 font-semibold">{games.length}</span>
                      </div>
                      <RowStrip games={games} statuses={statuses} onStatusChange={handleStatusChange} onOpen={openGame} />
                    </section>
                  )
                })
              })()}
            </div>
          )}
        </main>
      </div>

      {/* Stats bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[200px] bg-[#111] border-t-2 border-[#003791] px-4 py-2.5 flex items-center gap-3 overflow-x-auto scrollbar-none z-20">
        <Stat color="bg-[#003791]" label={`${stats.joguei} joguei`} />
        <Stat color="bg-blue-700"   label={`${stats.zerado} zerado`} />
        <Stat color="bg-teal-600"   label={`${stats.jogando} jogando`} />
        <Stat color="bg-yellow-500" label={`${stats.cem_porcento} 100%`} />
        <Stat color="bg-purple-700" label={`${stats.quero} quero`} />
        <span className="ml-auto flex-shrink-0 text-[12px] font-semibold text-gray-500">
          {console_.games.length.toLocaleString('pt-BR')} jogos
        </span>
      </div>

      {selected && (
        <GameModal
          game={selected}
          consoleId={CONSOLE_ID}
          status={statuses[selected.id] || {}}
          onStatusChange={handleStatusChange}
          onClose={closeGame}
          onPrev={selectedIndex > 0 ? goPrev : null}
          onNext={selectedList && selectedIndex < selectedList.length - 1 ? goNext : null}
        />
      )}
    </div>
  )
}

function Stat({ color, label }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[12px] font-semibold text-gray-500">{label}</span>
    </div>
  )
}
