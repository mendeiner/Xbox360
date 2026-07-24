import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NotificationBell from './social/NotificationBell'
import { CONSOLES } from '../consoles/consoleTiles'

// Ready consoles first, "Em breve" placeholders greyed out at the bottom — the flyout is a
// fast functional shortcut, not the place to sell the roadmap (that's what /consoles is for).
const FLYOUT_TILES = [...CONSOLES.filter(c => c.ready), ...CONSOLES.filter(c => !c.ready)]

// Per-console tuning for how each logo sits inside its flyout pill, dialed in visually against
// the real 49×36 tile. The logo fills the pill (object-contain) and gets three independent
// transforms: zoom = scale(), move = translate() as a % of the tile, crop = clip-path inset()
// [top,right,bottom,left] % that masks an edge to invisible without shifting the rest. `white`
// recolors the artwork to solid white so dark logos (PS1/PS2…) read on the near-black menu; GBA
// keeps its own color. Values are % / unitless so they hold proportionally at any tile size.
const LOGO_ART = {
  xbox360:    { zoom: 1,    moveX: 0,   moveY: 0,  crop: [0, 0, 0, 0],  white: true },
  ps1:        { zoom: 2.7,  moveX: 105, moveY: 0,  crop: [0, 76, 0, 0], white: true },
  ps2:        { zoom: 1,    moveX: 4,   moveY: 9,  crop: [0, 0, 44, 0], white: true },
  ps3:        { zoom: 0.95, moveX: 0,   moveY: 0,  crop: [0, 0, 0, 0],  white: true },
  snes:       { zoom: 1,    moveX: 0,   moveY: 0,  crop: [0, 0, 0, 0],  white: true },
  nsw:        { zoom: 1.75, moveX: 0,   moveY: 22, crop: [0, 0, 35, 0], white: true },
  n64:        { zoom: 1,    moveX: 0,   moveY: 0,  crop: [0, 0, 0, 0],  white: true },
  gamecube:   { zoom: 2.7,  moveX: 108, moveY: 0,  crop: [0, 79, 0, 0], white: true },
  wii:        { zoom: 1,    moveX: 0,   moveY: 0,  crop: [0, 0, 0, 0],  white: true },
  ps4:        { zoom: 1.2,  moveX: 2,   moveY: 0,  crop: [0, 0, 0, 0],  white: true },
  gba:        { zoom: 1,    moveX: 0,   moveY: 0,  crop: [0, 0, 0, 0],  white: true },
  '3ds':      { zoom: 2.05, moveX: -52, moveY: 0,  crop: [0, 0, 0, 54], white: true },
  gbc:        { zoom: 1,    moveX: 0,   moveY: 0,  crop: [0, 0, 0, 0],  white: true },
  xboxone:    { zoom: 0.9,  moveX: 0,   moveY: 0,  crop: [0, 0, 0, 0],  white: true },
  xboxorig:   { zoom: 1,    moveX: 0,   moveY: 0,  crop: [0, 0, 0, 0],  white: true },
  xboxseries: { zoom: 1,    moveX: 0,   moveY: 0,  crop: [0, 0, 0, 0],  white: false },
  pc:         { zoom: 1,    moveX: 0,   moveY: 0,  crop: [0, 0, 0, 0],  white: true },
  ps5:        { zoom: 1.6,  moveX: -24, moveY: 0,  crop: [0, 0, 0, 34], white: true },
  wiiu:       { zoom: 1,    moveX: 0,   moveY: 0,  crop: [0, 0, 0, 0],  white: true },
  nds:        { zoom: 2.15, moveX: -52, moveY: 0,  crop: [0, 4, 0, 54], white: true },
  dsi:        { zoom: 1,    moveX: 0,   moveY: 0,  crop: [0, 0, 0, 0],  white: true },
  psp:        { zoom: 1,    moveX: 4,   moveY: 11, crop: [0, 0, 43, 0], white: true },
  vita:       { zoom: 1.05, moveX: 5,   moveY: 6,  crop: [0, 0, 42, 0], white: true },
}

// Any console not yet tuned (future "Em breve" ones, or a console added later) falls back to a
// neutral white-and-centered fit so it's at least legible on the dark menu — drop it into the
// preview tool later and paste a LOGO_ART entry to fine-tune.
const DEFAULT_ART = { zoom: 1, moveX: 0, moveY: 0, crop: [0, 0, 0, 0], white: true }

function logoStyle(id) {
  const a = LOGO_ART[id] ?? DEFAULT_ART
  const [t, r, b, l] = a.crop
  return {
    transform: `translate(${a.moveX}%, ${a.moveY}%) scale(${a.zoom})`,
    clipPath: `inset(${t}% ${r}% ${b}% ${l}%)`,
    filter: a.white ? 'brightness(0) invert(1)' : undefined,
  }
}

export default function Nav() {
  const { user, profile, signOut, mockLogin } = useAuth()

  return (
    <nav className="sticky top-0 z-50 bg-surface-1/90 backdrop-blur border-b border-surface-4 px-6 py-0.5 flex items-center justify-between">
      <div className="flex items-center gap-5">
        <Link to="/home" className="flex items-center hover:opacity-90 transition-opacity">
          <img src="/jogalera-logo.svg" alt="JogaLera" className="h-14 w-auto" />
        </Link>
        {user && (
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/home" className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">Painel</Link>
            <div className="relative group">
              <Link to="/consoles" className="text-xs font-semibold text-gray-400 hover:text-social transition-colors">Consoles</Link>
              <div className="absolute left-0 top-full pt-2 hidden group-hover:block group-focus-within:block z-50">
                <div className="grid grid-cols-4 gap-1.5 p-3 rounded-xl bg-surface-2 border border-surface-4 shadow-xl w-[240px]">
                  {FLYOUT_TILES.map(c => (
                    c.ready ? (
                      <Link
                        key={c.id}
                        to={`/${c.id}`}
                        title={c.label}
                        className="flex items-center justify-center h-9 rounded-lg overflow-hidden hover:bg-surface-3 transition-colors"
                      >
                        <img src={c.logo} alt={c.label} className="w-full h-full object-contain" style={logoStyle(c.id)} />
                      </Link>
                    ) : (
                      <div
                        key={c.id}
                        title={`${c.label} — Em breve`}
                        className="flex items-center justify-center h-9 rounded-lg overflow-hidden opacity-30 cursor-not-allowed"
                      >
                        <img src={c.logo} alt={c.label} className="w-full h-full object-contain" style={logoStyle(c.id)} />
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
            <Link to="/feed" className="text-xs font-semibold text-gray-400 hover:text-social transition-colors">Feed</Link>
            <Link to="/rankings" className="text-xs font-semibold text-gray-400 hover:text-social transition-colors">Rankings</Link>
            <Link to="/polls" className="text-xs font-semibold text-gray-400 hover:text-social transition-colors">Votações</Link>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <NotificationBell userId={user.id} />
            <Link
              to={profile?.username ? `/u/${profile.username}` : '/home'}
              className="text-sm text-gray-400 hover:text-white font-medium flex items-center gap-1.5"
            >
              {user.id === 'mock-user' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold">TESTE</span>
              )}
              {profile?.username ?? ''}
            </Link>
            <button
              onClick={signOut}
              className="text-xs text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-surface-4 hover:border-gray-500"
            >
              Sair
            </button>
          </>
        ) : (
          <button
            onClick={mockLogin}
            className="text-xs font-bold text-yellow-400 hover:text-yellow-300 transition-colors px-3 py-1.5 rounded-lg border border-yellow-500/30 hover:border-yellow-400/50 bg-yellow-500/10"
          >
            Entrar como Teste
          </button>
        )}
      </div>
    </nav>
  )
}
