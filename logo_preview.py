#!/usr/bin/env python3
"""Interactive tuner for how each console logo sits inside the Nav.jsx flyout pill.

Reusable dev tool (not part of the build). Regenerate whenever you add or re-tune a console:

    python3 logo_preview.py                 # writes logo_preview.html next to this script
    python3 logo_preview.py /tmp/out.html   # or write somewhere else

Then open the HTML (or publish it as an artifact) and drag the sliders. Each console has three
independent controls that mirror exactly what Nav.jsx applies to the <img>:

    Zoom  -> transform: scale(z)           uniform, never stretches
    Move  -> transform: translate(x%, y%)  % of the tile, resolution-independent
    Crop  -> clip-path: inset(t% r% b% l%) masks an edge to invisible; nothing else shifts
    white -> filter: brightness(0) invert(1) to recolor a dark logo white on the dark menu

Hit "Copy all values" and paste the block back; each entry maps 1:1 onto a LOGO_ART row in
src/components/Nav.jsx. Any *.svg in public/logos that isn't in SEED below is auto-appended with
neutral white defaults, so brand-new logos appear here the moment you drop the file in.
"""
import base64, json, os, sys, glob

HERE = os.path.dirname(os.path.abspath(__file__))
LOGOS_DIR = os.path.join(HERE, "public", "logos")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "logo_preview.html")

# Keep this in sync with LOGO_ART in src/components/Nav.jsx. label + ordering + seed values.
# [id, label, {zoom, moveX, moveY, crop:[t,r,b,l], white}]
SEED = [
    ("xbox360",   "Xbox 360",   dict(zoom=1,    moveX=0,   moveY=0,  crop=[0, 0, 0, 0],  white=True)),
    ("ps1",       "PS1",        dict(zoom=2.7,  moveX=105, moveY=0,  crop=[0, 76, 0, 0], white=True)),
    ("ps2",       "PS2",        dict(zoom=1,    moveX=4,   moveY=9,  crop=[0, 0, 44, 0], white=True)),
    ("ps3",       "PS3",        dict(zoom=0.95, moveX=0,   moveY=0,  crop=[0, 0, 0, 0],  white=True)),
    ("snes",      "SNES",       dict(zoom=1,    moveX=0,   moveY=0,  crop=[0, 0, 0, 0],  white=True)),
    ("nsw",       "Switch",     dict(zoom=1.75, moveX=0,   moveY=22, crop=[0, 0, 35, 0], white=True)),
    ("n64",       "N64",        dict(zoom=1,    moveX=0,   moveY=0,  crop=[0, 0, 0, 0],  white=True)),
    ("gamecube",  "GameCube",   dict(zoom=2.7,  moveX=108, moveY=0,  crop=[0, 79, 0, 0], white=True)),
    ("wii",       "Wii",        dict(zoom=1,    moveX=0,   moveY=0,  crop=[0, 0, 0, 0],  white=True)),
    ("ps4",       "PS4",        dict(zoom=1.2,  moveX=2,   moveY=0,  crop=[0, 0, 0, 0],  white=True)),
    ("gba",       "GBA",        dict(zoom=1,    moveX=0,   moveY=0,  crop=[0, 0, 0, 0],  white=True)),
    ("3ds",       "3DS",        dict(zoom=2.05, moveX=-52, moveY=0,  crop=[0, 0, 0, 54], white=True)),
    ("gbc",       "GBC",        dict(zoom=1,    moveX=0,   moveY=0,  crop=[0, 0, 0, 0],  white=True)),
    ("xboxone",   "Xbox One",   dict(zoom=0.9,  moveX=0,   moveY=0,  crop=[0, 0, 0, 0],  white=True)),
    ("xboxorig",  "Xbox",       dict(zoom=1,    moveX=0,   moveY=0,  crop=[0, 0, 0, 0],  white=True)),
    ("xboxseries","Xbox Series",dict(zoom=1,    moveX=0,   moveY=0,  crop=[0, 0, 0, 0],  white=False)),
    ("pc",        "PC",         dict(zoom=1,    moveX=0,   moveY=0,  crop=[0, 0, 0, 0],  white=True)),
    ("ps5",       "PS5",        dict(zoom=1.6,  moveX=-24, moveY=0,  crop=[0, 0, 0, 34], white=True)),
    ("wiiu",      "Wii U",      dict(zoom=1,    moveX=0,   moveY=0,  crop=[0, 0, 0, 0],  white=True)),
    ("nds",       "Nintendo DS",dict(zoom=2.15, moveX=-52, moveY=0,  crop=[0, 4, 0, 54], white=True)),
    ("dsi",       "Nintendo DSi",dict(zoom=1,   moveX=0,   moveY=0,  crop=[0, 0, 0, 0],  white=True)),
    ("psp",       "PSP",        dict(zoom=1,    moveX=4,   moveY=11, crop=[0, 0, 43, 0], white=True)),
    ("vita",      "PS Vita",    dict(zoom=1.05, moveX=5,   moveY=6,  crop=[0, 0, 42, 0], white=True)),
]

# Resolve each console id to whichever logo file exists (svg or png).
def logo_path(cid):
    for ext in (".svg", ".png"):
        p = os.path.join(LOGOS_DIR, cid + ext)
        if os.path.exists(p):
            return p
    return None

# Auto-append any logo file present in public/logos that SEED doesn't already list.
known = {cid for cid, _, _ in SEED}
for path in sorted(glob.glob(os.path.join(LOGOS_DIR, "*.svg")) + glob.glob(os.path.join(LOGOS_DIR, "*.png"))):
    cid = os.path.splitext(os.path.basename(path))[0]
    if cid not in known:
        known.add(cid)
        SEED.append((cid, cid, dict(zoom=1, moveX=0, moveY=0, crop=[0, 0, 0, 0], white=True)))

data_uris = {}
for cid, *_ in SEED:
    path = logo_path(cid)
    if not path:
        continue
    mime = "image/svg+xml" if path.endswith(".svg") else "image/png"
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    data_uris[cid] = f"data:{mime};base64,{b64}"

CONSOLES = [[cid, label, seed] for cid, label, seed in SEED if cid in data_uris]

data_json = json.dumps(data_uris)
consoles_json = json.dumps(CONSOLES)

html = f"""<title>Console logo hover preview</title>
<style>
  :root {{ color-scheme: dark; }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0; padding: 32px 20px 120px;
    background: #0a0e1a;
    font-family: -apple-system, Segoe UI, Roboto, sans-serif;
    color: #e5e5e5;
  }}
  h1 {{ font-size: 20px; margin: 0 0 4px; }}
  p.sub {{ color: #9a9aa8; font-size: 13px; margin: 0 0 8px; max-width: 720px; line-height: 1.55; }}
  .legend {{ font-size: 12px; color: #8a8a98; margin: 0 0 20px; max-width: 720px; line-height: 1.7; }}
  .legend b {{ font-weight: 700; }}

  .toolbar {{
    display: flex; align-items: center; gap: 18px;
    background: #14141c; border: 1px solid #262636; border-radius: 10px;
    padding: 10px 16px; margin-bottom: 24px; font-size: 13px; width: fit-content;
  }}
  .toolbar label {{ display: flex; align-items: center; gap: 6px; cursor: pointer; }}
  .toolbar button {{
    background: #23232f; color: #ddd; border: 1px solid #333; border-radius: 7px;
    padding: 5px 12px; font-size: 12px; cursor: pointer;
  }}
  .toolbar button:hover {{ background: #2c2c3a; }}

  .section-title {{ font-size: 12px; text-transform: uppercase; letter-spacing: .07em; color: #666; margin: 30px 0 10px; }}

  /* real flyout mockup, matching Nav.jsx: w-[240px], p-3, gap-1.5, 4 cols, tile h-9 */
  .flyout-demo {{
    display: inline-block; vertical-align: top;
    background: #1a1a1a; border: 1px solid #333; border-radius: 12px;
    padding: 12px; box-shadow: 0 20px 40px rgba(0,0,0,.5); margin-right: 24px; margin-bottom: 12px;
  }}
  .flyout-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; width: 240px; }}

  .pill {{
    border-radius: 8px; background: transparent; transition: background .15s;
    overflow: hidden; position: relative;
  }}
  .pill.real {{ width: 49px; height: 36px; }}
  .pill.big  {{ width: 220px; height: 161px; }}
  .pill:hover, .pill.force-hover {{ background: #252525; }}
  .pill.bordered {{ border: 1px solid #262636; }}
  .pill img {{
    width: 100%; height: 100%;
    object-fit: contain;
    transform-origin: center center;
    display: block;
  }}
  .pill.white img {{ filter: brightness(0) invert(1); }}

  .pill.orig {{ display: flex; align-items: center; justify-content: center; }}
  .pill.orig img {{ width: auto; height: 16px; max-width: 85%; }}

  .rows {{ display: flex; flex-direction: column; gap: 2px; }}
  .row {{
    display: grid;
    grid-template-columns: 78px 66px 66px 1fr;
    align-items: center;
    gap: 16px;
    padding: 14px;
    border-bottom: 1px solid #1c1c26;
    border-radius: 8px;
  }}
  .row:hover {{ background: #12121a; }}
  .row .label {{ font-weight: 600; font-size: 13px; color: #ccc; }}
  .row .label small {{ display:block; font-weight: 400; color:#666; font-size: 10px; margin-top:2px; }}
  .row .label button {{
    margin-top: 8px; background: #23232f; color: #aaa; border: 1px solid #333;
    border-radius: 6px; padding: 3px 8px; font-size: 10px; cursor: pointer;
  }}
  .row .label button:hover {{ background: #2c2c3a; color: #ddd; }}

  .pill-slot {{ display: flex; flex-direction: column; align-items: center; gap: 4px; }}
  .pill-slot .cap {{ font-size: 9px; text-transform: uppercase; letter-spacing: .05em; color: #555; }}

  .controls {{ display: flex; flex-direction: column; gap: 10px; }}
  .group-title {{ font-size: 10px; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 4px; font-weight: 700; }}
  .group.zoom .group-title {{ color: #6ab7ff; }}
  .group.move .group-title {{ color: #7ee787; }}
  .group.crop .group-title {{ color: #ff9e64; }}
  .grid1 {{ display: grid; grid-template-columns: 1fr; gap: 4px 18px; max-width: 320px; }}
  .grid2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 4px 18px; }}
  .ctrl label {{ font-size: 10px; color: #888; display: flex; justify-content: space-between; gap: 6px; margin-bottom: 1px; }}
  .ctrl input[type=range] {{ width: 100%; }}
  .val {{ color: #ddd; font-variant-numeric: tabular-nums; }}
  .white-toggle {{ display: flex; align-items: center; gap: 6px; font-size: 11px; color: #aaa; white-space: nowrap; }}
  .zoom input[type=range] {{ accent-color: #6ab7ff; }}
  .move input[type=range] {{ accent-color: #7ee787; }}
  .crop input[type=range] {{ accent-color: #ff9e64; }}
</style>

<h1>Console logo hover fix — preview</h1>
<p class="sub">Every pill is the exact size of the real Nav.jsx flyout tile (49&times;36&nbsp;px), with a magnified copy beside it. Sliders start from the values already baked into Nav.jsx, so you refine from the current look. Three <b>independent</b> tools per console:</p>
<p class="legend">
  <b style="color:#6ab7ff">Zoom</b> &mdash; scales the whole logo up/down. X and Y always scale together, so it can never stretch.<br>
  <b style="color:#7ee787">Move</b> &mdash; slides the logo around inside the pill. Never resizes it.<br>
  <b style="color:#ff9e64">Crop</b> &mdash; masks an edge so part of the logo turns <i>invisible</i> (pill background shows there). Nothing moves or resizes &mdash; the hidden part just disappears and the rest stays put.
</p>

<div class="toolbar">
  <label><input type="checkbox" id="hoverToggle"> Force hover background on every pill</label>
  <button id="copyBtn">Copy all values</button>
</div>

<div class="section-title">Today (raw logo, for reference)</div>
<div class="flyout-demo"><div class="flyout-grid" id="flyout-today"></div></div>

<div class="section-title">Proposed (live, reflects the sliders below)</div>
<div class="flyout-demo"><div class="flyout-grid" id="flyout-proposed"></div></div>

<div class="section-title">One by one</div>
<div class="rows" id="rows"></div>

<script>
const DATA = {data_json};
const CONSOLES = {consoles_json}; // [id, label, seed{{zoom,moveX,moveY,crop,white}}]
const state = {{}};
CONSOLES.forEach(([id, label, seed]) => {{
  state[id] = {{ zoom: seed.zoom, moveX: seed.moveX, moveY: seed.moveY,
                 top: seed.crop[0], right: seed.crop[1], bottom: seed.crop[2], left: seed.crop[3],
                 white: seed.white }};
}});
const SEEDMAP = {{}};
CONSOLES.forEach(([id, label, seed]) => {{ SEEDMAP[id] = seed; }});

function css(s) {{
  return {{
    transform: `translate(${{s.moveX}}%, ${{s.moveY}}%) scale(${{s.zoom}})`,
    clipPath: `inset(${{s.top}}% ${{s.right}}% ${{s.bottom}}% ${{s.left}}%)`,
    white: s.white,
  }};
}}

const refs = {{}};
function makePill(id, sizeClass) {{
  const pill = document.createElement('div');
  pill.className = 'pill bordered ' + sizeClass;
  const img = document.createElement('img');
  img.src = DATA[id];
  pill.appendChild(img);
  (refs[id] = refs[id] || []).push({{ pill, img }});
  apply(id);
  return pill;
}}
function makeOrigPill(id) {{
  const pill = document.createElement('div');
  pill.className = 'pill real orig bordered';
  const img = document.createElement('img');
  img.src = DATA[id];
  pill.appendChild(img);
  return pill;
}}
function apply(id) {{
  const c = css(state[id]);
  (refs[id] || []).forEach(({{ pill, img }}) => {{
    img.style.transform = c.transform;
    img.style.clipPath = c.clipPath;
    pill.classList.toggle('white', c.white);
  }});
}}

const todayGrid = document.getElementById('flyout-today');
const proposedGrid = document.getElementById('flyout-proposed');
CONSOLES.forEach(([id]) => {{
  todayGrid.appendChild(makeOrigPill(id));
  proposedGrid.appendChild(makePill(id, 'real'));
}});

const rows = document.getElementById('rows');
CONSOLES.forEach(([id, label]) => {{
  const row = document.createElement('div');
  row.className = 'row';

  const lbl = document.createElement('div');
  lbl.className = 'label';
  lbl.innerHTML = `${{label}}<small>${{id}}</small>`;
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'reset';
  lbl.appendChild(resetBtn);
  row.appendChild(lbl);

  const todaySlot = document.createElement('div');
  todaySlot.className = 'pill-slot';
  todaySlot.innerHTML = '<div class="cap">today</div>';
  todaySlot.appendChild(makeOrigPill(id));
  row.appendChild(todaySlot);

  const bigSlot = document.createElement('div');
  bigSlot.className = 'pill-slot';
  bigSlot.innerHTML = '<div class="cap">magnified</div>';
  bigSlot.appendChild(makePill(id, 'big'));
  row.appendChild(bigSlot);

  const controls = document.createElement('div');
  controls.className = 'controls';
  const setters = [];

  function slider(name, key, min, max, step, unit) {{
    const wrap = document.createElement('div');
    wrap.className = 'ctrl';
    const l = document.createElement('label');
    const valSpan = document.createElement('span');
    valSpan.className = 'val';
    const fmt = v => (unit === 'x' ? (+v).toFixed(2) : v) + unit;
    valSpan.textContent = fmt(state[id][key]);
    l.textContent = name + ' ';
    l.appendChild(valSpan);
    const input = document.createElement('input');
    input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = state[id][key];
    input.oninput = () => {{
      state[id][key] = parseFloat(input.value);
      valSpan.textContent = fmt(input.value);
      apply(id);
    }};
    setters.push(() => {{ input.value = state[id][key]; valSpan.textContent = fmt(state[id][key]); }});
    wrap.appendChild(l); wrap.appendChild(input);
    return wrap;
  }}

  const gZoom = document.createElement('div');
  gZoom.className = 'group zoom';
  gZoom.innerHTML = '<div class="group-title">Zoom</div>';
  const zg = document.createElement('div'); zg.className = 'grid1';
  zg.appendChild(slider('scale', 'zoom', 0.3, 8, 0.05, 'x'));
  gZoom.appendChild(zg);
  controls.appendChild(gZoom);

  const gMove = document.createElement('div');
  gMove.className = 'group move';
  gMove.innerHTML = '<div class="group-title">Move</div>';
  const mg = document.createElement('div'); mg.className = 'grid2';
  mg.appendChild(slider('left ↔ right', 'moveX', -150, 150, 1, '%'));
  mg.appendChild(slider('up ↕ down', 'moveY', -150, 150, 1, '%'));
  gMove.appendChild(mg);
  controls.appendChild(gMove);

  const gCrop = document.createElement('div');
  gCrop.className = 'group crop';
  gCrop.innerHTML = '<div class="group-title">Crop (hide edges)</div>';
  const cg = document.createElement('div'); cg.className = 'grid2';
  cg.appendChild(slider('top', 'top', 0, 95, 1, '%'));
  cg.appendChild(slider('right', 'right', 0, 95, 1, '%'));
  cg.appendChild(slider('bottom', 'bottom', 0, 95, 1, '%'));
  cg.appendChild(slider('left', 'left', 0, 95, 1, '%'));
  gCrop.appendChild(cg);
  controls.appendChild(gCrop);

  const whiteWrap = document.createElement('label');
  whiteWrap.className = 'white-toggle';
  const whiteCb = document.createElement('input');
  whiteCb.type = 'checkbox'; whiteCb.checked = state[id].white;
  whiteCb.onchange = () => {{ state[id].white = whiteCb.checked; apply(id); }};
  whiteWrap.appendChild(whiteCb);
  whiteWrap.appendChild(document.createTextNode('white (uncheck to keep original color)'));
  controls.appendChild(whiteWrap);

  resetBtn.onclick = () => {{
    const s = SEEDMAP[id];
    Object.assign(state[id], {{ zoom: s.zoom, moveX: s.moveX, moveY: s.moveY,
      top: s.crop[0], right: s.crop[1], bottom: s.crop[2], left: s.crop[3], white: s.white }});
    setters.forEach(fn => fn());
    whiteCb.checked = state[id].white;
    apply(id);
  }};

  row.appendChild(controls);
  rows.appendChild(row);
}});

document.getElementById('hoverToggle').addEventListener('change', (e) => {{
  document.querySelectorAll('.pill').forEach(p => p.classList.toggle('force-hover', e.target.checked));
}});

document.getElementById('copyBtn').addEventListener('click', () => {{
  const out = {{}};
  CONSOLES.forEach(([id]) => {{
    const s = state[id];
    out[id] = {{ zoom: +(+s.zoom).toFixed(2), moveX: s.moveX, moveY: s.moveY,
                 crop: [s.top, s.right, s.bottom, s.left], white: s.white }};
  }});
  const text = JSON.stringify(out, null, 2);
  navigator.clipboard.writeText(text).then(
    () => {{ const b = document.getElementById('copyBtn'); b.textContent = 'Copied!'; setTimeout(() => b.textContent = 'Copy all values', 1500); }},
    () => {{ prompt('Copy these values:', text); }}
  );
}});
</script>
"""

with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)

print("wrote", OUT, len(html), "bytes,", len(CONSOLES), "logos")
