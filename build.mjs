import { readFileSync, writeFileSync } from "node:fs";
const require_fs_write = (t) => writeFileSync("depth-report.txt", t);
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import * as A from "./kit/audit.mjs";
import { W, H, PIECES, STAGGER, SPRING, build } from "./geometry.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const FAST = process.argv.includes("--fast");
const t0 = Date.now();
const { P, V, R } = build();
for (const it of R.items) it.base = it.key;

if (!FAST) {
  // depth states: rest, apart, uniform shares and the prefix states of the stagger
  const states = process.argv.includes("--full") ? undefined : [...A.uniformStates(10), ...A.prefixStates(STAGGER, { shares: [0.5, 1] })];
  A.settle(R, P, states ? { states } : {});
}
R.items.sort((a, b) => a.key - b.key);

const GROUPS = {
  canopy: ["canopy"], hood: ["hood"], engine: ["engine"], radiator: ["radiator"], counterweight: ["counterweight"], tanks: ["tanks"], station: ["station"],
  platform: ["platform"], ring: ["ring"], boom: ["boom"], swing: ["swing"], blade: ["blade"], tracks: ["trackL", "trackR"], covers: ["coverL", "coverR"], center: ["center"],
};
const GROUP_OF = Object.fromEntries(Object.entries(GROUPS).flatMap(([g, list]) => list.map((id) => [id, g])));
const LIST = ["canopy", "hood", "engine", "radiator", "counterweight", "tanks", "station", "platform", "ring", "swing", "boom", "blade", "covers", "tracks", "center"];
const NAMES = {
  canopy: "Навес", hood: "Капот", engine: "Двигатель Kubota и насос", radiator: "Радиатор", counterweight: "Противовес", tanks: "Гидробак и топливный бак",
  station: "Место оператора", platform: "Поворотная платформа", ring: "Опорно-поворотный круг", swing: "Поворот стрелы", boom: "Стрела, рукоять, ковш",
  blade: "Отвал", covers: "Закрытые гидромоторы", tracks: "Гусеницы", center: "Раздвижная рама",
};
const BRAND = new Set(["hood", "boom", "swing"]);
const BRAND_SKIP = /bucket|link|pin|cyl|hose|tooth|adapter|edge|ear|clamp|nipple|stack|raincap|lock|swing\.lug/;

const groups = R.items.map((item, index) => {
  const [mx, my, mz] = item.move;
  const s = item.spread ?? [0, 0, 0];
  const brand = BRAND.has(item.piece) && !BRAND_SKIP.test(item.name) ? " data-brand" : "";
  return `<g class="it" data-piece="${item.piece}" data-g="${GROUP_OF[item.piece]}"${brand} data-k="${item.key.toFixed(2)}" data-m="${mx},${my},${mz}" data-s="${s.join(",")}"${item.hold ? ` data-hold="${item.hold}"` : ""}${item.b !== undefined ? ` data-b="${item.b}" data-base="${item.base.toFixed(3)}"` : ""} data-i="${index}">${item.svg}</g>`;
});

const unit = (vector) => {
  const o = k.iso([0, 0, 0], P);
  const p = k.iso(vector, P);
  return [p[0] - o[0], p[1] - o[1]];
};
const ground = `<path class="iso-halo" d="${k.haloOf({ x: -80, y: -62, w: 180, d: 124, r: 30 }, -2, 2, P)}" style="filter:blur(14px)"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg kt-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Мини-экскаватор RUMM 18 в изометрии: ходовая с раздвижной рамой и закрытыми гидромоторами, поворотная платформа, двигатель Kubota D902 с гидронасосом, радиатор, баки, место оператора, навес, поворотная стрела с ковшом и отвал. При наведении машина разбирается на узлы.">${ground}<g class="kt-machine">${groups.join("")}</g></svg>`;

const DATA = {
  V,
  EX: unit([1, 0, 0]),
  EY: unit([0, 1, 0]),
  EZ: unit([0, 0, 1]),
  stagger: STAGGER,
  spring: SPRING,
  groups: GROUPS,
  list: LIST,
  names: NAMES,
  P,
  pieces: Object.fromEntries(Object.entries(PIECES).map(([id, p]) => [id, { move: p.move }])),
  say: Object.fromEntries(Object.entries(GROUPS).map(([g, list]) => [g, PIECES[list[0]].say])),
};

const chips = LIST.map((g) => `<button type="button" class="kt-chip" data-part="${g}">${NAMES[g]}</button>`).join("");
const body = `
<section class="kt-banner" aria-label="RUMM 18 в разборе">
  <div class="kt-copy">
    <h2 class="kt-title">RUMM 18 изнутри</h2>
    <p class="kt-lead">Наведите на машину, чтобы разобрать её на узлы. Шасси раздвигается, моторы хода закрыты крышками, стрела поворачивается вбок для работы вдоль стены.</p>
    <dl class="kt-specs">
      <div><dt>Масса</dt><dd>1 800 кг</dd></div>
      <div><dt>Двигатель</dt><dd>Kubota D902, 11,2 кВт</dd></div>
      <div><dt>Глубина копания</dt><dd>2 060 мм</dd></div>
    </dl>
    <div class="kt-actions">
      <button type="button" class="kt-btn kt-btn-main" data-apart>Разобрать</button>
      <button type="button" class="kt-btn" data-spread aria-pressed="false">Раздвинуть шасси</button>
      <button type="button" class="kt-btn" data-swing aria-pressed="false">Повернуть стрелу</button>
    </div>
    <div class="kt-chips" role="group" aria-label="Узлы машины">${chips}</div>
  </div>
  <div class="kt-plate">
    <div class="kt-stage" tabindex="0" role="group" aria-roledescription="интерактивная схема" aria-label="RUMM 18. Наведите или нажмите пробел, чтобы разобрать; стрелки выбирают узел; S раздвигает шасси; R поворачивает стрелу; Escape собирает обратно.">${svg}</div>
    <p class="kt-readout" data-readout aria-live="polite">RUMM 18 · 1 800 кг · Kubota D902</p>
    <p class="kt-hint" data-hint>Наведите, чтобы разобрать</p>
  </div>
</section>`;

const src = (f) => readFileSync(join(HERE, f), "utf8");
const exportsOf = (text) => [...text.matchAll(/^export (?:const|function|let|class) ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
const strip = (text) => text.replace(/^import .*$/gm, "").replace(/^export /gm, "");
const mod = (name, file, pre = "") => { const t = src(file); return `const ${name} = (() => {${pre}\n${strip(t)}\nreturn { ${exportsOf(t).join(", ")} };\n})();\n`; };
const BUNDLE = mod("K", "kit/iso-kit.mjs") + mod("G", "kit/lathe.mjs", "const { cameraOf, iso, pathOf } = K;") + mod("TUBE", "kit/tube.mjs", "const { iso, pathOf } = K;") +
  mod("PARTS", "parts.mjs", "const k = K; const { tubePieces, tubeSvg } = TUBE; const AUDIT = null;") + mod("BOOM", "boom.mjs");
const CSS = readFileSync(join(HERE, "banner.css"), "utf8");
const LIVE = BUNDLE + readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const page = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RUMM 18 изнутри — K-TRUCK</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>${k.ISO_CSS}${CSS}</style></head><body class="iso" data-theme="dark">${body}<script type="module">${LIVE.replace(/<\/(script)/gi, "<\\/$1")}</script></body></html>`;
writeFileSync(join(HERE, "rumm18-banner.html"), page);
console.log("wrote rumm18-banner.html", `${(page.length / 1024).toFixed(0)} KB`, `${R.items.length} items`, `${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (!FAST) {
  const st = R.settled;
  console.log(`settle: ${st.states.length} states · ${st.overlaps.pairs.length} overlaps · dropped ${st.solved.dropped?.length ?? 0} · cycles ${st.solved.cycles?.length ?? 0}`);
}
if (process.argv.includes("--depth")) {
  const res = A.depthOrder(R.settled.items, P, { overlaps: R.settled.overlaps, solved: R.settled.solved });
  require_fs_write(A.report({ depth: res }));
}
