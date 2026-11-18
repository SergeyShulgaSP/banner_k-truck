const D = __DATA__;
const root = document.querySelector("[data-rumm]");
const SCROLL = root.hasAttribute("data-scroll");
const stage = root.querySelector(".kt-stage");
const machine = stage.querySelector(".kt-machine");
const readout = root.querySelector("[data-readout]");
const hint = root.querySelector("[data-hint]");
const apartButton = root.querySelector("[data-apart]");
const spreadButton = root.querySelector("[data-spread]");
const swingButton = root.querySelector("[data-swing]");
const chips = [...root.querySelectorAll(".kt-chip")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const DEFAULT = "RUMM 18 · 1 800 кг · Kubota D902";

const nodes = [...machine.querySelectorAll(".it")].map((el) => {
  const m = el.dataset.m.split(",").map(Number);
  const s = el.dataset.s.split(",").map(Number);
  const hold = el.dataset.hold ? el.querySelector(`#${el.dataset.hold} path`) : null;
  return { el, piece: el.dataset.piece, group: el.dataset.g, key: Number(el.dataset.k), m, s, hold, shown: "", lift: m[0] * D.V[0] + m[1] * D.V[1] + m[2] * D.V[2], slift: s[0] * D.V[0] + s[1] * D.V[1] + s[2] * D.V[2] };
});
let order = nodes.map((_, i) => i);
for (const n of nodes) { n.b = n.el.dataset.b !== undefined ? Number(n.el.dataset.b) : -1; n.base = Number(n.el.dataset.base || 0); n.key0 = n.key; }
const boomNodes = []; for (const n of nodes) if (n.b >= 0) boomNodes[n.b] = n;

// ---- boom swing: rebuild the swing bracket and everything on it at the new angle ----
const STUB_A = new Proxy({}, { get: () => () => null });
function rebuildBoom(theta) {
  const out = [];
  let count = 0;
  const Rs = {
    put: ({ at = null, bias = 0, svg }) => { const item = { svg, base: at ? at[0] * D.V[0] + at[1] * D.V[1] + at[2] * D.V[2] + bias : bias }; out.push(item); return item; },
    solid: (s) => s, nameFor: (b) => `${b}#${++count}`, route: () => [],
  };
  const X = { ...PARTS.makeParts(D.P, Rs, D.pieces, STUB_A), P: D.P, PIECES: D.pieces };
  BOOM.boom(X, theta);
  out.forEach((item, i) => {
    const n = boomNodes[i];
    if (!n) return;
    n.el.innerHTML = item.svg;
    n.key = n.key0 + (item.base - n.base);
  });
}
const swing = { x: 0, v: 0, target: 0 };
let swungAt = 0;
const SPRING = D.spring;
const springOf = () => ({ x: 0, v: 0, target: 0, pending: null });
const piece = Object.fromEntries(D.stagger.map((id) => [id, springOf()]));
const spread = springOf();

let clock = 0, apart = false, spreadOn = false, selected = null;
let touring = !still.matches && !SCROLL, tourClock = 0, idleTimer = 0, leaveTimer = 0;
let visible = false, frame = 0, last = 0;

const screen = (v, share) => [(D.EX[0] * v[0] + D.EY[0] * v[1] + D.EZ[0] * v[2]) * share, (D.EX[1] * v[0] + D.EY[1] * v[1] + D.EZ[1] * v[2]) * share];

function say(text) { if (readout.textContent !== text) readout.textContent = text; }
function status() {
  const moving = D.stagger.some((id) => piece[id].pending || Math.abs(piece[id].x - piece[id].target) > 0.01);
  if (selected) return D.say[selected];
  if (moving) return apart ? "разбираем…" : "собираем…";
  if (Math.abs(spread.x - spread.target) > 0.01) return spreadOn ? "шасси раздвигается…" : "шасси сдвигается…";
  if (Math.abs(swing.x) > 0.02 || swing.target !== 0) return swing.target > 0 ? "стрела повёрнута влево · копает вдоль стены" : swing.target < 0 ? "стрела повёрнута вправо · копает вдоль забора" : "стрела возвращается";
  if (apart) return "в разборе · 15 узлов";
  if (spreadOn) return "шасси раздвинуто · устойчивее на склоне";
  return DEFAULT;
}

function setApart(on) {
  if (apart === on) return;
  if (on && swing.target !== 0) setSwing(0);
  apart = on;
  const goal = on ? 1 : 0;
  let index = 0;
  for (const id of on ? D.stagger : [...D.stagger].reverse()) {
    const p = piece[id];
    if (p.target === goal) p.pending = null;
    else p.pending = { value: goal, at: clock + (still.matches ? 0 : index++ * SPRING.stagger) };
  }
  if (apartButton) apartButton.textContent = on ? "Собрать" : "Разобрать";
  if (!on) select(null);
  run();
}
function setSpread(on) {
  spreadOn = on;
  spread.target = on ? 1 : 0;
  if (spreadButton) { spreadButton.setAttribute("aria-pressed", String(on)); spreadButton.textContent = on ? "Сдвинуть шасси" : "Раздвинуть шасси"; }
  run();
}
function setSwing(value) {
  swing.target = value;
  if (swingButton) swingButton.setAttribute("aria-pressed", String(value !== 0));
  run();
}
function select(group) {
  if (selected === group) return;
  selected = group;
  for (const n of nodes) (group && n.group === group ? n.el.setAttribute("data-on", "") : n.el.removeAttribute("data-on"));
  group ? stage.setAttribute("data-focus", "") : stage.removeAttribute("data-focus");
  chips.forEach((c) => (c.dataset.part === group ? c.setAttribute("data-on", "") : c.removeAttribute("data-on")));
}

function step(state, dt, calm) {
  if (state.pending && clock >= state.pending.at) { state.target = state.pending.value; state.pending = null; }
  if (calm) { state.x = state.target; state.v = 0; return false; }
  for (let i = 0; i < SPRING.substeps; i++) {
    const h = dt / SPRING.substeps;
    state.v += ((state.target - state.x) * SPRING.stiffness - state.v * SPRING.damping) * h;
    state.x += state.v * h;
  }
  if (Math.abs(state.target - state.x) < 2e-4 && Math.abs(state.v) < 2e-4) { state.x = state.target; state.v = 0; return state.pending !== null; }
  return true;
}

function place() {
  for (const n of nodes) {
    const share = piece[n.piece].x;
    const [ax, ay] = screen(n.m, share);
    const [bx, by] = screen(n.s, spread.x);
    const tx = ax + bx, ty = ay + by;
    const moved = Math.abs(tx) > 0.005 || Math.abs(ty) > 0.005;
    const text = moved ? `translate(${tx.toFixed(2)} ${ty.toFixed(2)})` : "";
    if (text !== n.shown) {
      n.shown = text;
      text ? n.el.setAttribute("transform", text) : n.el.removeAttribute("transform");
      if (n.hold) {
        moved ? n.hold.setAttribute("transform", `translate(${(-tx).toFixed(2)} ${(-ty).toFixed(2)})`) : n.hold.removeAttribute("transform");
      }
    }
  }
  const keyOf = (n) => n.key + n.lift * piece[n.piece].x + n.slift * spread.x;
  const next = nodes.map((_, i) => i).sort((a, b) => keyOf(nodes[a]) - keyOf(nodes[b]));
  if (next.some((v, i) => v !== order[i])) {
    const frag = document.createDocumentFragment();
    for (const i of next) frag.appendChild(nodes[i].el);
    machine.appendChild(frag);
    order = next;
  }
}

const T0 = 9.4;
const TOUR = [
  [0, () => { setSpread(false); setApart(false); select(null); setSwing(0); }],
  [1.4, () => setSwing(0.7)],
  [3.6, () => setSwing(-0.7)],
  [5.8, () => setSwing(0)],
  [6.6, () => setSpread(true)],
  [T0, () => setApart(true)],
  ...D.list.map((g, i) => [T0 + 2 + i * 1.5, () => select(g)]),
  [T0 + 2 + D.list.length * 1.5, () => select(null)],
  [T0 + 3 + D.list.length * 1.5, () => { setApart(false); }],
  [T0 + 5.2 + D.list.length * 1.5, () => setSpread(false)],
];
const TOUR_LEN = T0 + 8 + D.list.length * 1.5;
let tourIndex = 0;
function tourTick(dt) {
  tourClock += dt;
  if (tourClock >= TOUR_LEN) { tourClock = 0; tourIndex = 0; }
  while (tourIndex < TOUR.length && tourClock >= TOUR[tourIndex][0]) TOUR[tourIndex++][1]();
}

// ---- scroll mode: the page sets a progress 0..1 and every share follows it directly ----
let progress = 0;
const smooth = (t) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };
function applyProgress() {
  spread.x = spread.target = smooth((progress - 0.18) / 0.14);
  spreadOn = spread.x > 0.5;
  D.stagger.forEach((id, i) => { const p = piece[id]; p.x = p.target = smooth((progress - 0.36 - i * 0.018) / 0.24); p.v = 0; p.pending = null; });
  apart = piece[D.stagger[0]].x > 0.5;
  if (selected && piece[D.stagger[D.stagger.length - 1]].x < 0.9) select(null);
}
window.RUMM = { progress(p) { progress = p; if (SCROLL) { applyProgress(); place(); say(status()); } }, swing: (v) => setSwing(v) };
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  clock += dt;
  const calm = still.matches;
  if (touring) tourTick(dt);
  let moving = false;
  if (!SCROLL) {
    for (const id of D.stagger) moving = step(piece[id], dt, calm) || moving;
    moving = step(spread, dt, calm) || moving;
  }
  if (calm) { swing.x = swing.target; swing.v = 0; }
  else {
    const w = 3.2;
    for (let i = 0; i < 4; i++) { const h = dt / 4; swing.v += (w * w * (swing.target - swing.x) - 2 * w * swing.v) * h; swing.x += swing.v * h; }
    if (Math.abs(swing.target - swing.x) < 1e-4 && Math.abs(swing.v) < 1e-4) { swing.x = swing.target; swing.v = 0; }
    else moving = true;
  }
  if (Math.abs(swing.x - swungAt) > 0.002 || (swing.x === swing.target && swing.x !== swungAt)) { rebuildBoom(swing.x); swungAt = swing.x; order = []; }
  place();
  say(status());
  frame = visible && (moving || touring) ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
function takeOver() {
  touring = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (!still.matches) { touring = true; tourClock = 0; tourIndex = 0; run(); } }, 9000);
}

new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

const fine = matchMedia("(hover: hover) and (pointer: fine)");
stage.addEventListener("pointermove", (event) => {
  if (!fine.matches) return;
  if (SCROLL) {
    const it = event.target.closest && event.target.closest(".it");
    select(piece[D.stagger[D.stagger.length - 1]].x > 0.95 && it ? it.dataset.g : null);
    say(status());
    return;
  }
  takeOver();
  clearTimeout(leaveTimer);
  setApart(true);
  const it = event.target.closest && event.target.closest(".it");
  select(it ? it.dataset.g : null);
});
stage.addEventListener("pointerleave", () => {
  if (!fine.matches) return;
  if (SCROLL) { select(null); say(status()); return; }
  clearTimeout(leaveTimer);
  leaveTimer = setTimeout(() => { select(null); setApart(false); }, 700);
});
stage.addEventListener("click", (event) => {
  if (fine.matches) return;
  if (SCROLL) {
    const it = event.target.closest && event.target.closest(".it");
    if (piece[D.stagger[D.stagger.length - 1]].x > 0.95) select(it && it.dataset.g !== selected ? it.dataset.g : null);
    say(status());
    return;
  }
  takeOver();
  const it = event.target.closest && event.target.closest(".it");
  if (!apart) setApart(true);
  else if (it) select(it.dataset.g === selected ? null : it.dataset.g);
  else setApart(false);
});
stage.addEventListener("keydown", (event) => {
  const i = selected ? D.list.indexOf(selected) : -1;
  if (SCROLL) {
    if (event.key === "r" || event.key === "R" || event.key === "к" || event.key === "К") { event.preventDefault(); setSwing(swing.target > 0 ? -0.7 : swing.target < 0 ? 0 : 0.7); }
    else if (piece[D.stagger[D.stagger.length - 1]].x > 0.95 && /^Arrow/.test(event.key)) { event.preventDefault(); select(D.list[(i + (/Right|Down/.test(event.key) ? 1 : -1) + D.list.length) % D.list.length]); say(status()); }
    return;
  }
  let handled = true;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") { setApart(true); select(D.list[(i + 1) % D.list.length]); }
  else if (event.key === "ArrowLeft" || event.key === "ArrowUp") { setApart(true); select(D.list[(i - 1 + D.list.length) % D.list.length]); }
  else if (event.key === " " || event.key === "Enter") setApart(!apart);
  else if (event.key === "Escape") setApart(false);
  else if (event.key === "s" || event.key === "S" || event.key === "ы" || event.key === "Ы") setSpread(!spreadOn);
  else if (event.key === "r" || event.key === "R" || event.key === "к" || event.key === "К") { setApart(false); setSwing(swing.target > 0 ? -0.7 : swing.target < 0 ? 0 : 0.7); }
  else handled = false;
  if (handled) { event.preventDefault(); takeOver(); run(); }
});
if (apartButton) apartButton.addEventListener("click", () => { takeOver(); setApart(!apart); });
if (spreadButton) spreadButton.addEventListener("click", () => { takeOver(); setSpread(!spreadOn); });
if (swingButton) swingButton.addEventListener("click", () => { takeOver(); setApart(false); setSwing(swing.target > 0 ? -0.7 : swing.target < 0 ? 0 : 0.7); });
chips.forEach((chip) => chip.addEventListener("click", () => { takeOver(); setApart(true); select(chip.dataset.part === selected ? null : chip.dataset.part); run(); }));
if (hint && !SCROLL) hint.textContent = fine.matches ? "Наведите, чтобы разобрать" : "Нажмите, чтобы разобрать";
place();
