// Per-console data loaders for registry.js's lazy-loading cache (see ensureConsoleData).
// Each loader dynamically imports a console's games/covers/dlc/trailers files so they
// become their own build chunk, fetched only once that console's data is actually needed.

export const DATA_LOADERS = {
  xbox360: () =>
    Promise.all([
      import('../data/xbox360/games'),
      import('../data/xbox360/covers_map'),
      import('../data/xbox360/dlc_data'),
      import('../data/xbox360/trailers_data'),
    ]).then(([g, c, d, t]) => ({ games: g.XBOX360_GAMES, covers: c.COVERS, dlc: d.DLC_DATA, trailers: t.TRAILERS })),

  ps2: () =>
    Promise.all([
      import('../data/ps2/games'),
      import('../data/ps2/covers_map'),
      import('../data/ps2/dlc_data'),
      import('../data/ps2/trailers_data'),
    ]).then(([g, c, d, t]) => ({ games: g.PS2_GAMES, covers: c.COVERS, dlc: d.DLC_DATA, trailers: t.TRAILERS })),

  ps3: () =>
    Promise.all([
      import('../data/ps3/games'),
      import('../data/ps3/covers_map'),
      import('../data/ps3/dlc_data'),
      import('../data/ps3/trailers_data'),
    ]).then(([g, c, d, t]) => ({ games: g.PS3_GAMES, covers: c.COVERS, dlc: d.DLC_DATA, trailers: t.TRAILERS })),

  snes: () =>
    Promise.all([
      import('../data/snes/games'),
      import('../data/snes/covers_map'),
      import('../data/snes/dlc_data'),
      import('../data/snes/trailers_data'),
    ]).then(([g, c, d, t]) => ({ games: g.SNES_GAMES, covers: c.COVERS, dlc: d.DLC_DATA, trailers: t.TRAILERS })),

  nsw: () =>
    Promise.all([
      import('../data/nsw/games'),
      import('../data/nsw/covers_map'),
      import('../data/nsw/dlc_data'),
      import('../data/nsw/trailers_data'),
    ]).then(([g, c, d, t]) => ({ games: g.NSW_GAMES, covers: c.COVERS, dlc: d.DLC_DATA, trailers: t.TRAILERS })),

  gba: () =>
    Promise.all([
      import('../data/gba/games'),
      import('../data/gba/covers_map'),
      import('../data/gba/dlc_data'),
      import('../data/gba/trailers_data'),
    ]).then(([g, c, d, t]) => ({ games: g.GBA_GAMES, covers: c.COVERS, dlc: d.DLC_DATA, trailers: t.TRAILERS })),

  wii: () =>
    Promise.all([
      import('../data/wii/games'),
      import('../data/wii/covers_map'),
      import('../data/wii/dlc_data'),
      import('../data/wii/trailers_data'),
    ]).then(([g, c, d, t]) => ({ games: g.WII_GAMES, covers: c.COVERS, dlc: d.DLC_DATA, trailers: t.TRAILERS })),

  ps4: () =>
    Promise.all([
      import('../data/ps4/games'),
      import('../data/ps4/covers_map'),
      import('../data/ps4/dlc_data'),
      import('../data/ps4/trailers_data'),
    ]).then(([g, c, d, t]) => ({ games: g.PS4_GAMES, covers: c.COVERS, dlc: d.DLC_DATA, trailers: t.TRAILERS })),

  n64: () =>
    Promise.all([
      import('../data/n64/games'),
      import('../data/n64/covers_map'),
      import('../data/n64/dlc_data'),
      import('../data/n64/trailers_data'),
    ]).then(([g, c, d, t]) => ({ games: g.N64_GAMES, covers: c.COVERS, dlc: d.DLC_DATA, trailers: t.TRAILERS })),

  gamecube: () =>
    Promise.all([
      import('../data/gamecube/games'),
      import('../data/gamecube/covers_map'),
      import('../data/gamecube/dlc_data'),
      import('../data/gamecube/trailers_data'),
    ]).then(([g, c, d, t]) => ({ games: g.GAMECUBE_GAMES, covers: c.COVERS, dlc: d.DLC_DATA, trailers: t.TRAILERS })),

  '3ds': () =>
    Promise.all([
      import('../data/3ds/games'),
      import('../data/3ds/covers_map'),
      import('../data/3ds/dlc_data'),
      import('../data/3ds/trailers_data'),
    ]).then(([g, c, d, t]) => ({ games: g.N3DS_GAMES, covers: c.COVERS, dlc: d.DLC_DATA, trailers: t.TRAILERS })),
}
