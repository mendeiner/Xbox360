import { XBOX360_GAMES } from '../data/xbox360/games'
import { COVERS as XBOX360_COVERS } from '../data/xbox360/covers_map'
import { DLC_DATA as XBOX360_DLC } from '../data/xbox360/dlc_data'
import { TRAILERS as XBOX360_TRAILERS } from '../data/xbox360/trailers_data'
import { PS2_GAMES } from '../data/ps2/games'
import { COVERS as PS2_COVERS } from '../data/ps2/covers_map'
import { DLC_DATA as PS2_DLC } from '../data/ps2/dlc_data'
import { TRAILERS as PS2_TRAILERS } from '../data/ps2/trailers_data'
import { PS3_GAMES } from '../data/ps3/games'
import { COVERS as PS3_COVERS } from '../data/ps3/covers_map'
import { DLC_DATA as PS3_DLC } from '../data/ps3/dlc_data'
import { TRAILERS as PS3_TRAILERS } from '../data/ps3/trailers_data'
import { SNES_GAMES } from '../data/snes/games'
import { COVERS as SNES_COVERS } from '../data/snes/covers_map'
import { DLC_DATA as SNES_DLC } from '../data/snes/dlc_data'
import { TRAILERS as SNES_TRAILERS } from '../data/snes/trailers_data'
import { NSW_GAMES } from '../data/nsw/games'
import { COVERS as NSW_COVERS } from '../data/nsw/covers_map'
import { DLC_DATA as NSW_DLC } from '../data/nsw/dlc_data'
import { TRAILERS as NSW_TRAILERS } from '../data/nsw/trailers_data'
import { GBA_GAMES } from '../data/gba/games'
import { COVERS as GBA_COVERS } from '../data/gba/covers_map'
import { DLC_DATA as GBA_DLC } from '../data/gba/dlc_data'
import { TRAILERS as GBA_TRAILERS } from '../data/gba/trailers_data'
import { WII_GAMES } from '../data/wii/games'
import { COVERS as WII_COVERS } from '../data/wii/covers_map'
import { DLC_DATA as WII_DLC } from '../data/wii/dlc_data'
import { TRAILERS as WII_TRAILERS } from '../data/wii/trailers_data'
import { PS4_GAMES } from '../data/ps4/games'
import { COVERS as PS4_COVERS } from '../data/ps4/covers_map'
import { DLC_DATA as PS4_DLC } from '../data/ps4/dlc_data'
import { TRAILERS as PS4_TRAILERS } from '../data/ps4/trailers_data'
import { N64_GAMES } from '../data/n64/games'
import { COVERS as N64_COVERS } from '../data/n64/covers_map'
import { DLC_DATA as N64_DLC } from '../data/n64/dlc_data'
import { TRAILERS as N64_TRAILERS } from '../data/n64/trailers_data'
import { GAMECUBE_GAMES } from '../data/gamecube/games'
import { COVERS as GAMECUBE_COVERS } from '../data/gamecube/covers_map'
import { DLC_DATA as GAMECUBE_DLC } from '../data/gamecube/dlc_data'
import { TRAILERS as GAMECUBE_TRAILERS } from '../data/gamecube/trailers_data'
import { N3DS_GAMES } from '../data/3ds/games'
import { COVERS as N3DS_COVERS } from '../data/3ds/covers_map'
import { DLC_DATA as N3DS_DLC } from '../data/3ds/dlc_data'
import { TRAILERS as N3DS_TRAILERS } from '../data/3ds/trailers_data'

const XBOX360_SPECIAL = [
  { id: 'dl',      label: 'Com Download' },
  { id: 'localMP', label: 'Local Multi' },
  { id: 'online',  label: 'Online Multi' },
]

const XBOX360_GROUPS = [
  {
    id: 'status', title: 'Status',
    filters: [
      { id: 'jogando',      label: 'Jogando' },
      { id: 'joguei',       label: 'Joguei' },
      { id: 'zerado',       label: 'Zerado' },
      { id: 'cem_porcento', label: '100%' },
      { id: 'quero',        label: 'Quero Jogar' },
    ],
  },
  {
    id: 'tipo', title: 'Tipo',
    filters: [
      { id: 'retail', label: 'Retail' },
      { id: 'arcade', label: 'XBLA' },
      { id: 'kinect', label: 'Kinect' },
    ],
  },
  {
    id: 'genero', title: 'Gênero',
    filters: [
      { id: 'Ação',          label: 'Ação' },
      { id: 'Aventura',      label: 'Aventura' },
      { id: 'RPG',           label: 'RPG' },
      { id: 'JRPG',          label: 'JRPG' },
      { id: 'FPS',           label: 'FPS' },
      { id: 'TPS',           label: 'TPS' },
      { id: 'Tiro',          label: 'Tiro' },
      { id: 'Hack and Slash',label: 'Hack & Slash' },
      { id: "Beat 'em up",   label: "Beat 'em up" },
      { id: 'Plataforma',    label: 'Plataforma' },
      { id: 'Furtivo',       label: 'Furtivo' },
      { id: 'Tático',        label: 'Tático' },
      { id: 'Sandbox',       label: 'Sandbox' },
      { id: 'Simulação',     label: 'Simulação' },
      { id: 'Estratégia',    label: 'Estratégia' },
      { id: 'Puzzle',        label: 'Puzzle' },
      { id: 'Terror',        label: 'Terror' },
      { id: 'Detetive',      label: 'Detetive' },
      { id: 'Mistério',      label: 'Mistério' },
      { id: 'Drama',         label: 'Drama' },
      { id: 'Comédia',       label: 'Comédia' },
      { id: 'Arcade',        label: 'Arcade' },
    ],
  },
  {
    id: 'esportes', title: 'Esportes',
    filters: [
      { id: 'Esportes',           label: 'Esportes (geral)' },
      { id: 'Futebol',            label: 'Futebol' },
      { id: 'Futebol Americano',  label: 'Fut. Americano' },
      { id: 'Basquete',           label: 'Basquete' },
      { id: 'Boxe',               label: 'Boxe' },
      { id: 'Luta',               label: 'Luta' },
      { id: 'Hóquei',             label: 'Hóquei' },
      { id: 'Baseball',           label: 'Baseball' },
      { id: 'Cricket',            label: 'Cricket' },
      { id: 'Corrida',            label: 'Corrida' },
      { id: 'Moto',               label: 'Moto' },
      { id: 'Skate',              label: 'Skate' },
      { id: 'Neve',               label: 'Neve' },
    ],
  },
  {
    id: 'outros', title: 'Outros',
    filters: [
      { id: 'Música',   label: 'Música' },
      { id: 'Ritmo',    label: 'Ritmo' },
      { id: 'Família',  label: 'Família' },
      { id: 'Fitness',  label: 'Fitness' },
    ],
  },
]

const PS2_SPECIAL = [
  { id: 'dl',      label: 'Com Download' },
  { id: 'localMP', label: 'Local Multi' },
  { id: 'online',  label: 'Online Multi' },
  { id: 'camera',  label: 'EyeToy' },
]

const PS2_GROUPS = [
  {
    id: 'status', title: 'Status',
    filters: [
      { id: 'jogando',      label: 'Jogando' },
      { id: 'joguei',       label: 'Joguei' },
      { id: 'zerado',       label: 'Zerado' },
      { id: 'cem_porcento', label: '100%' },
      { id: 'quero',        label: 'Quero Jogar' },
    ],
  },
  {
    id: 'genero', title: 'Gênero',
    filters: [
      { id: 'Ação',          label: 'Ação' },
      { id: 'Aventura',      label: 'Aventura' },
      { id: 'RPG',           label: 'RPG' },
      { id: 'JRPG',          label: 'JRPG' },
      { id: 'FPS',           label: 'FPS' },
      { id: 'TPS',           label: 'TPS' },
      { id: 'Tiro',          label: 'Tiro' },
      { id: 'Hack and Slash',label: 'Hack & Slash' },
      { id: 'Luta',          label: 'Luta' },
      { id: 'Plataforma',    label: 'Plataforma' },
      { id: 'Furtivo',       label: 'Furtivo' },
      { id: 'Tático',        label: 'Tático' },
      { id: 'Sandbox',       label: 'Sandbox' },
      { id: 'Simulação',     label: 'Simulação' },
      { id: 'Estratégia',    label: 'Estratégia' },
      { id: 'Puzzle',        label: 'Puzzle' },
      { id: 'Terror',        label: 'Terror' },
      { id: 'Drama',         label: 'Drama' },
      { id: 'Comédia',       label: 'Comédia' },
      { id: 'Arcade',        label: 'Arcade' },
    ],
  },
  {
    id: 'esportes', title: 'Esportes',
    filters: [
      { id: 'Esportes',           label: 'Esportes (geral)' },
      { id: 'Futebol Americano',  label: 'Fut. Americano' },
      { id: 'Basquete',           label: 'Basquete' },
      { id: 'Corrida',            label: 'Corrida' },
      { id: 'Skate',              label: 'Skate' },
      { id: 'Neve',               label: 'Neve' },
    ],
  },
  {
    id: 'outros', title: 'Outros',
    filters: [
      { id: 'Música',   label: 'Música' },
      { id: 'Ritmo',    label: 'Ritmo' },
      { id: 'Família',  label: 'Família' },
      { id: 'Fitness',  label: 'Fitness' },
    ],
  },
]

const PS3_SPECIAL = [
  { id: 'dl',      label: 'Com Download' },
  { id: 'localMP', label: 'Local Multi' },
  { id: 'online',  label: 'Online Multi' },
]

const PS4_SPECIAL = []

const PS4_GROUPS = [
  {
    id: 'status', title: 'Status',
    filters: [
      { id: 'jogando',      label: 'Jogando' },
      { id: 'joguei',       label: 'Joguei' },
      { id: 'zerado',       label: 'Zerado' },
      { id: 'cem_porcento', label: '100%' },
      { id: 'quero',        label: 'Quero Jogar' },
    ],
  },
  {
    id: 'genero', title: 'Gênero',
    filters: [
      { id: 'Ação',       label: 'Ação' },
      { id: 'Aventura',   label: 'Aventura' },
      { id: 'RPG',        label: 'RPG' },
      { id: 'FPS',        label: 'FPS' },
      { id: 'Luta',       label: 'Luta' },
      { id: 'Plataforma', label: 'Plataforma' },
      { id: 'Simulação',  label: 'Simulação' },
      { id: 'Estratégia', label: 'Estratégia' },
      { id: 'Puzzle',     label: 'Puzzle' },
      { id: 'Terror',     label: 'Terror' },
      { id: 'Arcade',     label: 'Arcade' },
      { id: 'Corrida',    label: 'Corrida' },
      { id: 'Esportes',   label: 'Esportes' },
      { id: 'Família',    label: 'Família' },
    ],
  },
]

const PS3_GROUPS = [
  {
    id: 'status', title: 'Status',
    filters: [
      { id: 'jogando',      label: 'Jogando' },
      { id: 'joguei',       label: 'Joguei' },
      { id: 'zerado',       label: 'Zerado' },
      { id: 'cem_porcento', label: '100%' },
      { id: 'quero',        label: 'Quero Jogar' },
    ],
  },
  {
    id: 'tipo', title: 'Tipo',
    filters: [
      { id: 'retail', label: 'Retail' },
      { id: 'psn',    label: 'PSN' },
    ],
  },
  {
    id: 'genero', title: 'Gênero',
    filters: [
      { id: 'Ação',          label: 'Ação' },
      { id: 'Aventura',      label: 'Aventura' },
      { id: 'RPG',           label: 'RPG' },
      { id: 'JRPG',          label: 'JRPG' },
      { id: 'FPS',           label: 'FPS' },
      { id: 'TPS',           label: 'TPS' },
      { id: 'Tiro',          label: 'Tiro' },
      { id: 'Hack and Slash',label: 'Hack & Slash' },
      { id: "Beat 'em up",   label: "Beat 'em up" },
      { id: 'Luta',          label: 'Luta' },
      { id: 'Plataforma',    label: 'Plataforma' },
      { id: 'Furtivo',       label: 'Furtivo' },
      { id: 'Tático',        label: 'Tático' },
      { id: 'Sandbox',       label: 'Sandbox' },
      { id: 'Simulação',     label: 'Simulação' },
      { id: 'Estratégia',    label: 'Estratégia' },
      { id: 'Puzzle',        label: 'Puzzle' },
      { id: 'Terror',        label: 'Terror' },
      { id: 'Drama',         label: 'Drama' },
      { id: 'Arcade',        label: 'Arcade' },
    ],
  },
  {
    id: 'esportes', title: 'Esportes',
    filters: [
      { id: 'Esportes',           label: 'Esportes (geral)' },
      { id: 'Futebol',            label: 'Futebol' },
      { id: 'Futebol Americano',  label: 'Fut. Americano' },
      { id: 'Basquete',           label: 'Basquete' },
      { id: 'Boxe',               label: 'Boxe' },
      { id: 'Luta Livre',         label: 'Luta Livre' },
      { id: 'Hóquei',             label: 'Hóquei' },
      { id: 'Baseball',           label: 'Baseball' },
      { id: 'Corrida',            label: 'Corrida' },
      { id: 'Moto',               label: 'Moto' },
      { id: 'Skate',              label: 'Skate' },
      { id: 'Neve',               label: 'Neve' },
      { id: 'Golfe',              label: 'Golfe' },
      { id: 'Tênis',              label: 'Tênis' },
    ],
  },
  {
    id: 'outros', title: 'Outros',
    filters: [
      { id: 'Música',   label: 'Música' },
      { id: 'Ritmo',    label: 'Ritmo' },
      { id: 'Família',  label: 'Família' },
      { id: 'Fitness',  label: 'Fitness' },
    ],
  },
]

const SNES_SPECIAL = [
  { id: 'dl', label: 'Com Download' },
]

const SNES_GROUPS = [
  {
    id: 'status', title: 'Status',
    filters: [
      { id: 'jogando',      label: 'Jogando' },
      { id: 'joguei',       label: 'Joguei' },
      { id: 'zerado',       label: 'Zerado' },
      { id: 'cem_porcento', label: '100%' },
      { id: 'quero',        label: 'Quero Jogar' },
    ],
  },
  {
    id: 'genero', title: 'Gênero',
    filters: [
      { id: 'Ação',          label: 'Ação' },
      { id: 'Aventura',      label: 'Aventura' },
      { id: 'RPG',           label: 'RPG' },
      { id: 'Tiro',          label: 'Tiro' },
      { id: "Beat 'em up",   label: "Beat 'em up" },
      { id: 'Luta',          label: 'Luta' },
      { id: 'Plataforma',    label: 'Plataforma' },
      { id: 'Simulação',     label: 'Simulação' },
      { id: 'Estratégia',    label: 'Estratégia' },
      { id: 'Puzzle',        label: 'Puzzle' },
      { id: 'Arcade',        label: 'Arcade' },
    ],
  },
  {
    id: 'esportes', title: 'Esportes',
    filters: [
      { id: 'Esportes', label: 'Esportes (geral)' },
      { id: 'Corrida',  label: 'Corrida' },
    ],
  },
  {
    id: 'outros', title: 'Outros',
    filters: [
      { id: 'Família',       label: 'Família' },
      { id: 'Educacional',   label: 'Educacional' },
      { id: 'Caça e Pesca',  label: 'Caça e Pesca' },
      { id: 'Quiz',          label: 'Quiz' },
      { id: 'Pinball',       label: 'Pinball' },
      { id: 'Tabuleiro',     label: 'Tabuleiro' },
      { id: 'Cassino',       label: 'Cassino' },
      { id: 'Cartas',        label: 'Cartas' },
    ],
  },
]

// No dl/localMP/online/camera fields tracked for NSW (none of those are verifiable from RAWG
// data without guessing), so there's nothing to offer as a special filter.
const NSW_SPECIAL = []

const NSW_GROUPS = [
  {
    id: 'status', title: 'Status',
    filters: [
      { id: 'jogando',      label: 'Jogando' },
      { id: 'joguei',       label: 'Joguei' },
      { id: 'zerado',       label: 'Zerado' },
      { id: 'cem_porcento', label: '100%' },
      { id: 'quero',        label: 'Quero Jogar' },
    ],
  },
  {
    id: 'genero', title: 'Gênero',
    filters: [
      { id: 'Ação',       label: 'Ação' },
      { id: 'Aventura',   label: 'Aventura' },
      { id: 'RPG',        label: 'RPG' },
      { id: 'Estratégia', label: 'Estratégia' },
      { id: 'FPS',        label: 'FPS' },
      { id: 'Simulação',  label: 'Simulação' },
      { id: 'Puzzle',     label: 'Puzzle' },
      { id: 'Arcade',     label: 'Arcade' },
      { id: 'Plataforma', label: 'Plataforma' },
      { id: 'Corrida',    label: 'Corrida' },
      { id: 'Esportes',   label: 'Esportes' },
      { id: 'Luta',       label: 'Luta' },
      { id: 'Família',    label: 'Família' },
      { id: 'Indie',      label: 'Indie' },
      { id: 'Casual',     label: 'Casual' },
      { id: 'MMO',        label: 'MMO' },
      { id: 'Tabuleiro',  label: 'Tabuleiro' },
      { id: 'Cartas',     label: 'Cartas' },
      { id: 'Educativo',  label: 'Educativo' },
    ],
  },
]

// Link Cable local multiplayer (TheGamesDB `players` > 1) is the only verifiable special
// flag for GBA -- no online play infrastructure existed for the handheld, so no 'online'.
const GBA_SPECIAL = [
  { id: 'dl',      label: 'Com Download' },
  { id: 'localMP', label: 'Link Cable' },
]

const GBA_GROUPS = [
  {
    id: 'status', title: 'Status',
    filters: [
      { id: 'jogando',      label: 'Jogando' },
      { id: 'joguei',       label: 'Joguei' },
      { id: 'zerado',       label: 'Zerado' },
      { id: 'cem_porcento', label: '100%' },
      { id: 'quero',        label: 'Quero Jogar' },
    ],
  },
  {
    id: 'genero', title: 'Gênero',
    filters: [
      { id: 'Ação',          label: 'Ação' },
      { id: 'Plataforma',    label: 'Plataforma' },
      { id: 'Aventura',      label: 'Aventura' },
      { id: 'Arcade',        label: 'Arcade' },
      { id: 'Esportes',      label: 'Esportes' },
      { id: 'Corrida',       label: 'Corrida' },
      { id: 'RPG',           label: 'RPG' },
      { id: 'Luta',          label: 'Luta' },
      { id: 'FPS',           label: 'FPS' },
      { id: 'Puzzle',        label: 'Puzzle' },
      { id: 'Estratégia',    label: 'Estratégia' },
      { id: 'Simulação',     label: 'Simulação' },
      { id: 'Casual',        label: 'Casual' },
      { id: 'Família',       label: 'Família' },
      { id: 'Indie',         label: 'Indie' },
      { id: 'Tabuleiro',     label: 'Tabuleiro' },
      { id: 'Cartas',        label: 'Cartas' },
      { id: 'Educativo',     label: 'Educativo' },
    ],
  },
]

const WII_SPECIAL = [
  { id: 'dl',         label: 'Com Download' },
  { id: 'localMP',    label: 'Local Multi' },
  { id: 'online',     label: 'Online Multi' },
  { id: 'motionPlus', label: 'Motion Plus' },
]

const WII_GROUPS = [
  {
    id: 'status', title: 'Status',
    filters: [
      { id: 'jogando',      label: 'Jogando' },
      { id: 'joguei',       label: 'Joguei' },
      { id: 'zerado',       label: 'Zerado' },
      { id: 'cem_porcento', label: '100%' },
      { id: 'quero',        label: 'Quero Jogar' },
    ],
  },
  {
    id: 'tipo', title: 'Tipo',
    filters: [
      { id: 'retail',           label: 'Retail' },
      { id: 'wiiware',          label: 'WiiWare' },
      { id: 'virtual_console',  label: 'Virtual Console' },
    ],
  },
  {
    id: 'genero', title: 'Gênero',
    filters: [
      { id: 'Ação',          label: 'Ação' },
      { id: 'Aventura',      label: 'Aventura' },
      { id: 'Plataforma',    label: 'Plataforma' },
      { id: 'Arcade',        label: 'Arcade' },
      { id: 'RPG',           label: 'RPG' },
      { id: 'FPS',           label: 'FPS' },
      { id: 'Tiro',          label: 'Tiro' },
      { id: "Beat 'em up",   label: "Beat 'em up" },
      { id: 'Luta',          label: 'Luta' },
      { id: 'Puzzle',        label: 'Puzzle' },
      { id: 'Estratégia',    label: 'Estratégia' },
      { id: 'Simulação',     label: 'Simulação' },
      { id: 'Terror',        label: 'Terror' },
      { id: 'Música',        label: 'Música' },
    ],
  },
  {
    id: 'esportes', title: 'Esportes',
    filters: [
      { id: 'Esportes',           label: 'Esportes (geral)' },
      { id: 'Futebol',            label: 'Futebol' },
      { id: 'Futebol Americano',  label: 'Fut. Americano' },
      { id: 'Basquete',           label: 'Basquete' },
      { id: 'Boxe',               label: 'Boxe' },
      { id: 'Luta Livre',         label: 'Luta Livre' },
      { id: 'Hóquei',             label: 'Hóquei' },
      { id: 'Baseball',           label: 'Baseball' },
      { id: 'Corrida',            label: 'Corrida' },
      { id: 'Skate',              label: 'Skate' },
      { id: 'Neve',               label: 'Neve' },
      { id: 'Golfe',              label: 'Golfe' },
      { id: 'Tênis',              label: 'Tênis' },
    ],
  },
]

// N64 has 4 native controller ports (no controller-pak/rumble-pak-specific tracking, see
// Phase 0 of the add-console skill) but no online play infrastructure, so only dl/localMP.
const N64_SPECIAL = [
  { id: 'dl',      label: 'Com Download' },
  { id: 'localMP', label: 'Local Multi' },
]

const N64_GROUPS = [
  {
    id: 'status', title: 'Status',
    filters: [
      { id: 'jogando',      label: 'Jogando' },
      { id: 'joguei',       label: 'Joguei' },
      { id: 'zerado',       label: 'Zerado' },
      { id: 'cem_porcento', label: '100%' },
      { id: 'quero',        label: 'Quero Jogar' },
    ],
  },
  {
    id: 'genero', title: 'Gênero',
    filters: [
      { id: 'Ação',          label: 'Ação' },
      { id: 'Aventura',      label: 'Aventura' },
      { id: 'Plataforma',    label: 'Plataforma' },
      { id: 'RPG',           label: 'RPG' },
      { id: 'Tiro',          label: 'Tiro' },
      { id: 'Luta',          label: 'Luta' },
      { id: "Beat 'em up",   label: "Beat 'em up" },
      { id: 'Puzzle',        label: 'Puzzle' },
      { id: 'Estratégia',    label: 'Estratégia' },
      { id: 'Simulação',     label: 'Simulação' },
      { id: 'Arcade',        label: 'Arcade' },
    ],
  },
  {
    id: 'esportes', title: 'Esportes',
    filters: [
      { id: 'Esportes', label: 'Esportes (geral)' },
      { id: 'Corrida',  label: 'Corrida' },
    ],
  },
  {
    id: 'outros', title: 'Outros',
    filters: [
      { id: 'Tabuleiro',    label: 'Tabuleiro' },
      { id: 'Caça e Pesca', label: 'Caça e Pesca' },
      { id: 'Quiz',         label: 'Quiz' },
      { id: 'Música',       label: 'Música' },
      { id: 'Cassino',      label: 'Cassino' },
      { id: 'Educativo',    label: 'Educativo' },
      { id: 'Casual',       label: 'Casual' },
    ],
  },
]

// Local multiplayer (No-Intro dat's `users` field, real per-disc max player count) is the
// only verifiable special flag for GameCube -- the Broadband/Modem Adapter existed but only
// a handful of titles (e.g. Phantasy Star Online) used it, not verifiable in bulk, so no 'online'.
const GAMECUBE_SPECIAL = [
  { id: 'dl',      label: 'Com Download' },
  { id: 'localMP', label: 'Local Multi' },
]

const GAMECUBE_GROUPS = [
  {
    id: 'status', title: 'Status',
    filters: [
      { id: 'jogando',      label: 'Jogando' },
      { id: 'joguei',       label: 'Joguei' },
      { id: 'zerado',       label: 'Zerado' },
      { id: 'cem_porcento', label: '100%' },
      { id: 'quero',        label: 'Quero Jogar' },
    ],
  },
  {
    id: 'genero', title: 'Gênero',
    filters: [
      { id: 'Ação',          label: 'Ação' },
      { id: 'Plataforma',    label: 'Plataforma' },
      { id: 'Aventura',      label: 'Aventura' },
      { id: 'Arcade',        label: 'Arcade' },
      { id: 'Esportes',      label: 'Esportes' },
      { id: 'Corrida',       label: 'Corrida' },
      { id: 'RPG',           label: 'RPG' },
      { id: 'Luta',          label: 'Luta' },
      { id: 'FPS',           label: 'FPS' },
      { id: 'Puzzle',        label: 'Puzzle' },
      { id: 'Estratégia',    label: 'Estratégia' },
      { id: 'Simulação',     label: 'Simulação' },
      { id: 'Família',       label: 'Família' },
    ],
  },
]

// GameTDB's `<wi-fi players>` and `<input players>` tags are real per-game data (same
// convention already used for PS3/Wii's localMP/online derivation) -- no 3D-stereoscopic flag
// exists in GameTDB's 3DS schema (only prose mentions in some synopses), so it's intentionally
// not tracked here rather than guessed.
const N3DS_SPECIAL = [
  { id: 'dl',      label: 'Com Download' },
  { id: 'localMP', label: 'Local Multi' },
  { id: 'online',  label: 'Online Multi' },
]

const N3DS_GROUPS = [
  {
    id: 'status', title: 'Status',
    filters: [
      { id: 'jogando',      label: 'Jogando' },
      { id: 'joguei',       label: 'Joguei' },
      { id: 'zerado',       label: 'Zerado' },
      { id: 'cem_porcento', label: '100%' },
      { id: 'quero',        label: 'Quero Jogar' },
    ],
  },
  {
    id: 'genero', title: 'Gênero',
    filters: [
      { id: 'Ação',          label: 'Ação' },
      { id: 'Aventura',      label: 'Aventura' },
      { id: 'Plataforma',    label: 'Plataforma' },
      { id: 'RPG',           label: 'RPG' },
      { id: 'Tiro',          label: 'Tiro' },
      { id: 'Luta',          label: 'Luta' },
      { id: 'Puzzle',        label: 'Puzzle' },
      { id: 'Estratégia',    label: 'Estratégia' },
      { id: 'Simulação',     label: 'Simulação' },
      { id: 'Arcade',        label: 'Arcade' },
    ],
  },
  {
    id: 'esportes', title: 'Esportes',
    filters: [
      { id: 'Esportes', label: 'Esportes (geral)' },
      { id: 'Corrida',  label: 'Corrida' },
    ],
  },
  {
    id: 'outros', title: 'Outros',
    filters: [
      { id: 'Tabuleiro',    label: 'Tabuleiro' },
      { id: 'Caça e Pesca', label: 'Caça e Pesca' },
      { id: 'Música',       label: 'Música' },
      { id: 'Educativo',    label: 'Educativo' },
      { id: 'Casual',       label: 'Casual' },
    ],
  },
]

export const CONSOLES = {
  xbox360: {
    id: 'xbox360',
    label: 'Xbox 360',
    accentColor: '#107C10',
    coverPrefix: '/covers/xbox360',
    ready: true,

    games: XBOX360_GAMES,
    // game id -> cover filename key (Xbox 360 uses an 8-char hex title-id; PS2 will use a serial code).
    covers: XBOX360_COVERS,
    dlc: XBOX360_DLC,
    trailers: XBOX360_TRAILERS,

    partIds: {
      pt1:'mx360gcxpt1-x360-ztm', pt2:'mx360gcpt2-x360-ztm', pt3:'mx360gcpt3-x360-ztm',
      pt4:'mx360gcpt4-x360-ztm', pt5:'mx360gcpt5-x360-ztm', pt6:'mx360gcpt6-x360-ztm',
      xbla:'XBOX_360_XBLA',
      god1:'XBOX_360_1', god2:'XBOX_360_2', god3:'XBOX_360_3',
      god4:'XBOX_360_4', god5:'XBOX_360_5', god6:'XBOX_360_6',
    },
    partNames: {
      pt1:'Part 1', pt2:'Part 2', pt3:'Part 3', pt4:'Part 4', pt5:'Part 5', pt6:'Part 6',
      xbla:'XBLA',
      god1:'GOD 1', god2:'GOD 2', god3:'GOD 3', god4:'GOD 4', god5:'GOD 5', god6:'GOD 6',
    },
    dlTypeLabel(part) {
      if (!part) return 'Download'
      if (part.startsWith('god')) return 'Download · GOD'
      if (part === 'xbla')        return 'Download · XBLA'
      return 'Download · XEX'
    },

    types: ['retail', 'arcade', 'kinect'],
    typeMap: {
      retail: ['Retail', 'text-green-400 bg-green-400/10 border-green-400/20'],
      arcade: ['XBLA',   'text-blue-400  bg-blue-400/10  border-blue-400/20' ],
      kinect: ['Kinect', 'text-pink-400  bg-pink-400/10  border-pink-400/20' ],
    },

    trailerSearchSuffix: 'Xbox 360 trailer',
    trailerCacheKey: 'xbox360_trailers',

    specialFilters: XBOX360_SPECIAL,
    filterGroups: XBOX360_GROUPS,
  },

  ps2: {
    id: 'ps2',
    label: 'PS2',
    accentColor: '#003791',
    coverPrefix: '/covers/ps2',
    ready: true,

    games: PS2_GAMES,
    // game id -> NTSC-U serial (e.g. SLUS-20312); kept for reference / re-running the covers
    // pipeline, but cover *files* are saved and looked up by game id (`coversById` below),
    // not by serial.
    covers: PS2_COVERS,
    coversById: true,
    dlc: PS2_DLC,
    trailers: PS2_TRAILERS,

    // Confirmed via archive.org metadata API: uploader samuray433's two-part Redump USA
    // collection (titles roughly A-J in p1, K-R in p2). No part 3+ exists. Titles outside
    // that range (S-Z) have no confirmed source yet, so they're left without a `dl` field.
    partIds: {
      p1: 'ps2usaredump1',
      p2: 'ps2usaredump1_20200816_1458',
    },
    partNames: {
      p1: 'Redump USA Parte 1',
      p2: 'Redump USA Parte 2',
    },
    dlTypeLabel() { return 'Download' },

    // No PS2 equivalent of XBLA/Kinect at the scale Xbox 360 has one — everything is 'retail';
    // EyeToy support is tracked as a `camera` boolean flag instead of a second `type` value.
    types: ['retail'],
    typeMap: {
      retail: ['Retail', 'text-blue-400 bg-blue-400/10 border-blue-400/20'],
    },

    trailerSearchSuffix: 'PS2 trailer',
    trailerCacheKey: 'ps2_trailers',

    specialFilters: PS2_SPECIAL,
    filterGroups: PS2_GROUPS,
  },

  ps3: {
    id: 'ps3',
    label: 'PS3',
    accentColor: '#00B4D8',
    coverPrefix: '/covers/ps3',
    ready: true,

    games: PS3_GAMES,
    // game id -> NTSC-U serial (e.g. BLUS30625); cover files are named by serial
    // (same convention as Xbox 360), so no `coversById` flag here.
    covers: PS3_COVERS,
    dlc: PS3_DLC,
    trailers: PS3_TRAILERS,

    // Confirmed via archive.org metadata API: uploader cvltofmirrors@gmail.com's Redump.org
    // PS3 USA collection, split A-Z (+ a numbers/symbols bucket) with some popular letters
    // further split into part1/part2/... by size. Identifiers follow `sony_playstation3_<letter>`
    // or `sony_playstation3_<letter>_part<N>`.
    partIds: {
      a1: 'sony_playstation3_a_part1',
      a2: 'sony_playstation3_a_part2',
      a3: 'sony_playstation3_a_part3',
      b1: 'sony_playstation3_b_part1',
      b2: 'sony_playstation3_b_part2',
      b3: 'sony_playstation3_b_part3',
      c1: 'sony_playstation3_c_part1',
      c2: 'sony_playstation3_c_part2',
      d1: 'sony_playstation3_d_part1',
      d2: 'sony_playstation3_d_part2',
      d3: 'sony_playstation3_d_part3',
      d4: 'sony_playstation3_d_part4',
      d5: 'sony_playstation3_d_part5',
      e: 'sony_playstation3_e',
      f1: 'sony_playstation3_f_part1',
      f2: 'sony_playstation3_f_part2',
      f3: 'sony_playstation3_f_part3',
      g1: 'sony_playstation3_g_part1',
      g2: 'sony_playstation3_g_part2',
      g3: 'sony_playstation3_g_part3',
      h1: 'sony_playstation3_h_part1',
      h2: 'sony_playstation3_h_part2',
      i: 'sony_playstation3_i',
      j: 'sony_playstation3_j',
      k: 'sony_playstation3_k',
      l1: 'sony_playstation3_l_part1',
      l2: 'sony_playstation3_l_part2',
      l3: 'sony_playstation3_l_part3',
      m1: 'sony_playstation3_m_part1',
      m2: 'sony_playstation3_m_part2',
      m3: 'sony_playstation3_m_part3',
      m4: 'sony_playstation3_m_part4',
      m5: 'sony_playstation3_m_part5',
      n1: 'sony_playstation3_n_part1',
      n2: 'sony_playstation3_n_part2',
      n3: 'sony_playstation3_n_part3',
      num: 'sony_playstation3_numberssymbols',
      o1: 'sony_playstation3_o_part1',
      o3: 'sony_playstation3_o_part3',
      p1: 'sony_playstation3_p_part1',
      p2: 'sony_playstation3_p_part2',
      q: 'sony_playstation3_q',
      r1: 'sony_playstation3_r_part1',
      r2: 'sony_playstation3_r_part2',
      r3: 'sony_playstation3_r_part3',
      r4: 'sony_playstation3_r_part4',
      s1: 'sony_playstation3_s_part1',
      s2: 'sony_playstation3_s_part2',
      s3: 'sony_playstation3_s_part3',
      s4: 'sony_playstation3_s_part4',
      s5: 'sony_playstation3_s_part5',
      s6: 'sony_playstation3_s_part6',
      t1: 'sony_playstation3_t_part1',
      t2: 'sony_playstation3_t_part2',
      t3: 'sony_playstation3_t_part3',
      t4: 'sony_playstation3_t_part4',
      u1: 'sony_playstation3_u_part1',
      u2: 'sony_playstation3_u_part2',
      v: 'sony_playstation3_v',
      w1: 'sony_playstation3_w_part1',
      w2: 'sony_playstation3_w_part2',
      x: 'sony_playstation3_x',
      y: 'sony_playstation3_y',
      z: 'sony_playstation3_z',
    },
    partNames: {
      a1: 'A Parte 1',
      a2: 'A Parte 2',
      a3: 'A Parte 3',
      b1: 'B Parte 1',
      b2: 'B Parte 2',
      b3: 'B Parte 3',
      c1: 'C Parte 1',
      c2: 'C Parte 2',
      d1: 'D Parte 1',
      d2: 'D Parte 2',
      d3: 'D Parte 3',
      d4: 'D Parte 4',
      d5: 'D Parte 5',
      e: 'E',
      f1: 'F Parte 1',
      f2: 'F Parte 2',
      f3: 'F Parte 3',
      g1: 'G Parte 1',
      g2: 'G Parte 2',
      g3: 'G Parte 3',
      h1: 'H Parte 1',
      h2: 'H Parte 2',
      i: 'I',
      j: 'J',
      k: 'K',
      l1: 'L Parte 1',
      l2: 'L Parte 2',
      l3: 'L Parte 3',
      m1: 'M Parte 1',
      m2: 'M Parte 2',
      m3: 'M Parte 3',
      m4: 'M Parte 4',
      m5: 'M Parte 5',
      n1: 'N Parte 1',
      n2: 'N Parte 2',
      n3: 'N Parte 3',
      num: 'Números e Símbolos',
      o1: 'O Parte 1',
      o3: 'O Parte 3',
      p1: 'P Parte 1',
      p2: 'P Parte 2',
      q: 'Q',
      r1: 'R Parte 1',
      r2: 'R Parte 2',
      r3: 'R Parte 3',
      r4: 'R Parte 4',
      s1: 'S Parte 1',
      s2: 'S Parte 2',
      s3: 'S Parte 3',
      s4: 'S Parte 4',
      s5: 'S Parte 5',
      s6: 'S Parte 6',
      t1: 'T Parte 1',
      t2: 'T Parte 2',
      t3: 'T Parte 3',
      t4: 'T Parte 4',
      u1: 'U Parte 1',
      u2: 'U Parte 2',
      v: 'V',
      w1: 'W Parte 1',
      w2: 'W Parte 2',
      x: 'X',
      y: 'Y',
      z: 'Z',
    },
    dlTypeLabel() { return 'Download' },

    types: ['retail', 'psn'],
    typeMap: {
      retail: ['Retail', 'text-blue-400 bg-blue-400/10 border-blue-400/20'],
      psn:    ['PSN',    'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' ],
    },

    trailerSearchSuffix: 'PS3 trailer',
    trailerCacheKey: 'ps3_trailers',

    specialFilters: PS3_SPECIAL,
    filterGroups: PS3_GROUPS,
  },

  ps4: {
    id: 'ps4',
    label: 'PS4',
    accentColor: '#003791',
    coverPrefix: '/covers/ps4',
    // RAWG's background_image is a full-bleed promo shot rather than a box scan (GameTDB
    // doesn't support PS4, so there's no box-art source the way PS3 has SvenGDK/PSMT-Covers),
    // same situation as NSW -- centered instead of right-anchored.
    coverAlign: 'center center',
    ready: true,

    games: PS4_GAMES,
    // game id -> RAWG `background_image` URL at catalog-build time; cover *files* are saved
    // and looked up by game id (`coversById` below), same convention as PS2/NSW.
    covers: PS4_COVERS,
    coversById: true,
    dlc: PS4_DLC,
    trailers: PS4_TRAILERS,

    // No archive.org download research for PS4 yet -- a real, documented gap, not a bug.
    partIds: {},
    partNames: {},
    dlTypeLabel() { return 'Download' },

    // GameTDB (PS3's disc/PSN source) doesn't cover PS4, and no other source reliably
    // distinguishes physical-disc vs digital-only releases across the full catalog, so
    // (unlike PS3) there's no type split here -- every game uses a single 'retail' value,
    // same convention as PS2/SNES/NSW.
    types: ['retail'],
    typeMap: {
      retail: ['Retail', 'text-blue-400 bg-blue-400/10 border-blue-400/20'],
    },

    trailerSearchSuffix: 'PS4 trailer',
    trailerCacheKey: 'ps4_trailers',

    specialFilters: PS4_SPECIAL,
    filterGroups: PS4_GROUPS,
  },

  snes: {
    id: 'snes',
    label: 'SNES',
    accentColor: '#E60012',
    coverPrefix: '/covers/snes',
    // Cart label scan (front+spine), landscape -- see coverAspect doc on the `gba` entry below.
    coverAspect: 'landscape',
    ready: true,

    games: SNES_GAMES,
    // game id -> libretro-thumbnails cover filename; cover *files* are saved and looked up
    // by game id (`coversById` below), same convention as PS2 — not by the source filename.
    covers: SNES_COVERS,
    coversById: true,
    dlc: SNES_DLC,
    trailers: SNES_TRAILERS,

    // No archive.org download research done yet for SNES — a known, deliberate gap, not a bug.
    partIds: {},
    partNames: {},
    dlTypeLabel() { return 'Download' },

    types: ['retail'],
    typeMap: {
      retail: ['Retail', 'text-red-400 bg-red-400/10 border-red-400/20'],
    },

    trailerSearchSuffix: 'SNES trailer',
    trailerCacheKey: 'snes_trailers',

    specialFilters: SNES_SPECIAL,
    filterGroups: SNES_GROUPS,
  },

  nsw: {
    id: 'nsw',
    label: 'Switch',
    accentColor: '#E4000F',
    coverPrefix: '/covers/nsw',
    // Portrait like xbox360/ps2/ps3, but RAWG's background_image is a full-bleed promo shot
    // rather than a box scan, so it's centered instead of right-anchored like the others.
    coverAlign: 'center center',
    ready: true,

    games: NSW_GAMES,
    // game id -> RAWG `background_image` URL at fetch time; cover *files* are saved and looked
    // up by game id (`coversById` below), same convention as PS2 — not by any RAWG/title id.
    covers: NSW_COVERS,
    coversById: true,
    dlc: NSW_DLC,
    trailers: NSW_TRAILERS,

    // No archive.org download research for NSW — Switch carts aren't a realistic redump/
    // archive.org source the way retro discs/ROMs are. A deliberate, permanent gap, not a bug.
    partIds: {},
    partNames: {},
    dlTypeLabel() { return 'Download' },

    // RAWG and titledb were both checked directly and neither carries a physical-cart-vs-
    // digital-only flag, so it isn't tracked rather than guessed — every game uses a single
    // 'retail' type value, same pattern as PS2/SNES.
    types: ['retail'],
    typeMap: {
      retail: ['Retail', 'text-red-400 bg-red-400/10 border-red-400/20'],
    },

    trailerSearchSuffix: 'Nintendo Switch trailer',
    trailerCacheKey: 'nsw_trailers',

    specialFilters: NSW_SPECIAL,
    filterGroups: NSW_GROUPS,
  },

  gba: {
    id: 'gba',
    label: 'GBA',
    accentColor: '#7B2D8E',
    coverPrefix: '/covers/gba',
    // Cover shape, read by GameCard/GameModal to size the cover slot and pick object-fit
    // instead of hardcoding a console check in those shared components:
    //   'portrait' (default, omit the field) -- disc/box case art, e.g. xbox360/ps2/ps3.
    //   'landscape' -- cart label scan (front+spine), e.g. snes.
    //   'square'    -- cart label scan only, e.g. libretro-thumbnails' GBA Named_Boxarts.
    // 'square'/'landscape' use object-contain (full scan shown, sizes vary slightly) while
    // 'portrait' uses object-cover (consistent box-case proportions, cropping is fine).
    coverAspect: 'square',
    ready: true,

    games: GBA_GAMES,
    // game id -> No-Intro USA serial (4-char GBA game code); cover *files* are saved and
    // looked up by game id (`coversById` below), same convention as PS2/SNES/NSW.
    covers: GBA_COVERS,
    coversById: true,
    dlc: GBA_DLC,
    trailers: GBA_TRAILERS,

    // Confirmed via archive.org metadata API: a single item holding the full No-Intro GBA
    // romset (ef_gba_no-intro_2024-02-21). One part, unlike PS2/PS3's alphabetical splits.
    partIds: {
      p1: 'ef_gba_no-intro_2024-02-21',
    },
    partNames: {
      p1: 'No-Intro USA Romset',
    },
    dlTypeLabel() { return 'Download' },

    types: ['retail'],
    typeMap: {
      retail: ['Retail', 'text-purple-400 bg-purple-400/10 border-purple-400/20'],
    },

    trailerSearchSuffix: 'GBA trailer',
    trailerCacheKey: 'gba_trailers',

    specialFilters: GBA_SPECIAL,
    filterGroups: GBA_GROUPS,
  },

  wii: {
    id: 'wii',
    label: 'Wii',
    accentColor: '#1492E6',
    coverPrefix: '/covers/wii',
    ready: true,

    games: WII_GAMES,
    // game id -> libretro-thumbnails Named_Boxarts filename; cover *files* are saved and
    // looked up by game id (`coversById` below), same convention as PS2/SNES/NSW/GBA.
    // GameTDB's own art server (the originally planned source) became unreachable mid-pipeline
    // and never recovered in-session, so covers were sourced from this GitHub mirror instead.
    covers: WII_COVERS,
    coversById: true,
    dlc: WII_DLC,
    trailers: WII_TRAILERS,

    // Confirmed via archive.org metadata API: uploader arquivista.exe@gmail.com's Redump USA
    // collection, split into part-2 (L-S) and part-3 (T-Z) RVZ dumps -- no US part-1 (#-K) was
    // ever uploaded (only a part-1-EU exists), so titles A-K have no confirmed retail `dl`, a
    // real gap like PS2's missing S-Z. WiiWare/Virtual Console digital titles come from a
    // separate "Nintendo - Wii-Ware" collection (w1).
    partIds: {
      p2: 'Wii-p2-US-Arquivista',
      p3: 'Wii-p3-US-Arquivista',
      w1: 'CentralArquivista-NintendoWiiWare',
    },
    partNames: {
      p2: 'Redump USA (L-S)',
      p3: 'Redump USA (T-Z)',
      w1: 'WiiWare / Virtual Console',
    },
    dlTypeLabel() { return 'Download' },

    // WiiWare and Virtual Console are both Wii Shop Channel digital purchases (GameTDB tracks
    // them as separate `type` values since VC titles are emulated re-releases of pre-Wii
    // games, not native Wii software, unlike a single digital storefront split).
    types: ['retail', 'wiiware', 'virtual_console'],
    typeMap: {
      retail:           ['Retail',           'text-blue-400  bg-blue-400/10  border-blue-400/20' ],
      wiiware:          ['WiiWare',          'text-cyan-400  bg-cyan-400/10  border-cyan-400/20' ],
      virtual_console:  ['Virtual Console',  'text-amber-400 bg-amber-400/10 border-amber-400/20'],
    },

    trailerSearchSuffix: 'Wii trailer',
    trailerCacheKey: 'wii_trailers',

    specialFilters: WII_SPECIAL,
    filterGroups: WII_GROUPS,
  },

  n64: {
    id: 'n64',
    label: 'N64',
    accentColor: '#1a1aff',
    coverPrefix: '/covers/n64',
    // libretro-thumbnails' N64 Named_Boxarts are full front+spine+back box scans (~4:3,
    // landscape), not portrait disc-case art -- see coverAspect doc on the `gba` entry above.
    coverAspect: 'landscape',
    ready: true,

    games: N64_GAMES,
    // game id -> libretro-thumbnails Named_Boxarts filename, kept for reference / re-running
    // the covers pipeline. Cover *files* are saved and looked up by game id (`coversById`
    // below), same convention as PS2/GBA/SNES/Wii.
    covers: N64_COVERS,
    coversById: true,
    dlc: N64_DLC,
    trailers: N64_TRAILERS,

    // Confirmed via archive.org metadata API: a single item holding the full No-Intro N64
    // romset (ef_nintendo_64_no-intro_2024-02-10, same uploader family as GBA's
    // ef_gba_no-intro_2024-02-21). One part, every confirmed `dl.file` matched exactly against
    // this item's file listing.
    partIds: {
      p1: 'ef_nintendo_64_no-intro_2024-02-10',
    },
    partNames: {
      p1: 'No-Intro USA Romset',
    },
    dlTypeLabel() { return 'Download' },

    // Every N64 cart is a single retail format -- no digital storefront equivalent existed
    // for this console, same convention as PS2/SNES/NSW/GBA.
    types: ['retail'],
    typeMap: {
      retail: ['Retail', 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20'],
    },

    trailerSearchSuffix: 'N64 trailer',
    trailerCacheKey: 'n64_trailers',

    specialFilters: N64_SPECIAL,
    filterGroups: N64_GROUPS,
  },

  gamecube: {
    id: 'gamecube',
    label: 'GameCube',
    accentColor: '#6a0dad',
    coverPrefix: '/covers/gamecube',
    ready: true,

    games: GAMECUBE_GAMES,
    // game id -> libretro-thumbnails Named_Boxarts filename, kept for reference / re-running
    // the covers pipeline. Cover *files* are saved and looked up by game id (`coversById`
    // below), same convention as PS2/GBA/SNES/Wii/N64.
    covers: GAMECUBE_COVERS,
    coversById: true,
    dlc: GAMECUBE_DLC,
    trailers: GAMECUBE_TRAILERS,

    // Confirmed via archive.org metadata API: a single item holding a full No-Intro-style
    // GameCube romset, zip-compressed (game-cube_202603, uploader andersonatrozms@hotmail.com).
    // One part; every confirmed `dl.file` matched exactly against this item's file listing.
    partIds: {
      p1: 'game-cube_202603',
    },
    partNames: {
      p1: 'No-Intro USA Romset',
    },
    dlTypeLabel() { return 'Download' },

    // Every GameCube disc is a single retail format -- no digital storefront equivalent
    // existed for this console, same convention as PS2/SNES/NSW/GBA/N64.
    types: ['retail'],
    typeMap: {
      retail: ['Retail', 'text-purple-400 bg-purple-400/10 border-purple-400/20'],
    },

    trailerSearchSuffix: 'GameCube trailer',
    trailerCacheKey: 'gamecube_trailers',

    specialFilters: GAMECUBE_SPECIAL,
    filterGroups: GAMECUBE_GROUPS,
  },

  '3ds': {
    id: '3ds',
    label: 'Nintendo 3DS',
    accentColor: '#d3232a',
    coverPrefix: '/covers/3ds',
    // GameTDB's 3DS cover art is a front-cover-only scan, ~1.14:1 (400x352), closer to square
    // than the disc-case portrait shape -- see coverAspect doc on the `gba` entry above.
    coverAspect: 'square',
    ready: true,

    games: N3DS_GAMES,
    // game id -> GameTDB id (e.g. 'A2AE'), kept for reference / re-running the covers pipeline.
    // Cover *files* are saved and looked up by game id (`coversById` below), same convention
    // as PS2/GBA/SNES/Wii/N64/GameCube.
    covers: N3DS_COVERS,
    coversById: true,
    dlc: N3DS_DLC,
    trailers: N3DS_TRAILERS,

    // Confirmed via archive.org metadata API: a single CIA-format item (nintendo-3ds-usa-cia,
    // uploader edward.geenwood007@gmail.com) covering A-Z. 334/1144 titles matched exactly
    // against its file listing -- the rest (mostly 3DSWare eShop titles, which this collection
    // doesn't aim to fully cover) have no `dl`, a documented gap rather than a guess.
    partIds: {
      p1: 'nintendo-3ds-usa-cia',
    },
    partNames: {
      p1: 'USA CIA Collection',
    },
    dlTypeLabel() { return 'Download' },

    // Real GameTDB type split: 3DS/New3DS (physical cart) vs 3DSWare (eShop digital). Virtual
    // Console re-releases (NES/GB/GBC/GG/GBA on 3DS) were excluded from the catalog entirely --
    // GameTDB has ~0% genre data for them and there's no archive.org source for that format.
    types: ['retail', 'eshop'],
    typeMap: {
      retail: ['Retail', 'text-red-400 bg-red-400/10 border-red-400/20'],
      eshop: ['eShop', 'text-sky-400 bg-sky-400/10 border-sky-400/20'],
    },

    trailerSearchSuffix: '3DS trailer',
    trailerCacheKey: '3ds_trailers',

    specialFilters: N3DS_SPECIAL,
    filterGroups: N3DS_GROUPS,
  },
}

export function getConsole(id) {
  return CONSOLES[id]
}

export function readyConsoles() {
  return Object.values(CONSOLES).filter(c => c.ready)
}
