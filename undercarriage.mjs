// Undercarriage of the RUMM 18 (structure after the Rippa R18 schematics E001–E005, L006, G012):
// a centre frame on the slewing ring, two telescopic beams and one telescopic cylinder per side,
// track frames with three bottom rollers, a front idler on a spring tensioner, a rear sprocket
// bolted to the travel motor, and a cover over the motor and its hoses. Units: 1 = 10 mm.
export const TRACK = { half: 43.5, width: 23, front: 57, rear: -57, r: 17, belt: 4.5 };
export const SPREAD = 13;

export function undercarriage(X) {
  const { k, G, A, P, V, S, L, Dots, at, put, FY, prism, box, turned, pinY, hydraulic, hose, lines } = X;
  const T = TRACK;
  const zc = T.r;
  const FYo = FY();

  // ---------- centre frame ----------
  box("center", [-38, 38], [-22, 22], [12, 31], { tone: "lo" }, { r: 9, steps: 6, bevel: 1, name: "center.frame", seams: [21] });
  box("center", [-30, 30], [-30, 30], [31, 33.6], { tone: "lo" }, { r: 14, steps: 8, bevel: 0.8, name: "center.deck", extra: Dots(G.dotsOf(X.FZ(0, 0, 0), 33.6, 26, 20, P, { all: true }), { size: 0.4, tone: "mid" }) });
  for (const side of [1, -1]) for (const x of [-24, 0, 24]) {
    const r = x === 0 ? 4.6 : 7.2;
    turned("center", FY(x, 22, 0, side), [[22, r], [25.5, r]], { tone: "lo" }, { name: "center.socket", hub: x === 0 ? 3 : 5.2, bolts: x === 0 ? 0 : 6, boltR: 6.2 });
  }
  // blade lugs on the front of the frame
  for (const side of [1, -1]) prism("center", FYo, [[33, 13], [38, 13], [44.6, 21], [38, 27.5]], side > 0 ? 25.6 : -27.4, side > 0 ? 27.4 : -25.6, { tone: "lo" }, { name: "center.lug" });

  // ---------- tracks ----------
  const belt = [];
  belt.push({ poly: [[T.rear, zc + T.r - T.belt], [T.front, zc + T.r - T.belt], [T.front, zc + T.r], [T.rear, zc + T.r]], kind: "top" });
  belt.push({ poly: [[T.rear, 0], [T.front, 0], [T.front, T.belt], [T.rear, T.belt]], kind: "bottom" });
  const arcPoly = (cx, a0, a1, n = 4) => {
    const outer = Array.from({ length: n }, (_, i) => a0 + ((a1 - a0) * i) / (n - 1)).map((a) => [cx + T.r * Math.cos(a), zc + T.r * Math.sin(a)]);
    const inner = [a1, a0].map((a) => [cx + (T.r - T.belt) * Math.cos(a), zc + (T.r - T.belt) * Math.sin(a)]);
    return [...outer, ...inner];
  };
  const SEG = 8;
  for (let i = 0; i < SEG; i++) {
    const a0 = -Math.PI / 2 + (Math.PI * i) / SEG, a1 = -Math.PI / 2 + (Math.PI * (i + 1)) / SEG;
    belt.push({ poly: arcPoly(T.front, a0, a1), kind: "arc", cx: T.front, a: (a0 + a1) / 2 });
    belt.push({ poly: arcPoly(T.rear, Math.PI - a1, Math.PI - a0), kind: "arc", cx: T.rear, a: Math.PI - (a0 + a1) / 2 });
  }

  for (const [piece, side] of [["trackL", 1], ["trackR", -1]]) {
    const cover = side > 0 ? "coverL" : "coverR";
    const yc = side * T.half;
    const lo = yc - T.width / 2, hi = yc + T.width / 2;
    const yIn = yc - side * T.width / 2;
    const faceY = V[1] > 0 ? hi : lo;
    const sp = [0, side * SPREAD, 0];
    const opt = (o) => ({ ...o, spread: sp });

    // track frame inside the loop
    prism(piece, FYo, [[-40, 15.8], [24, 15.8], [28, 19], [28, 24], [25, 27.5], [-42, 27.5], [-44.2, 24], [-44.2, 19]], yc - 7, yc + 7, { tone: "lo" }, opt({ name: `${piece}.frame`,
      inner: L([k.segment([-44.2, faceY > yc ? yc + 7 : yc - 7, 21.5], [28, faceY > yc ? yc + 7 : yc - 7, 21.5], P)].join(""), { tone: "faint" }) }));
    prism(piece, FYo, [[-40, 27.5], [34, 27.5], [30, 29.4], [-36, 29.4]], yc - 8, yc + 8, { tone: "lo" }, opt({ name: `${piece}.deflector` }));
    // grease-nipple guard of the tensioner
    X.box(piece, [18, 26], side > 0 ? [yc + 7, yc + 8.6] : [yc - 8.6, yc - 7], [17, 26], { tone: "mid" }, opt({ name: `${piece}.guard`, r: 0.6, extra: Dots([at([22, side > 0 ? yc + 8.6 : yc - 8.6, 21.5])], { size: 0.7, tone: "hi" }) }));
    // bottom rollers, double flanged
    const rollerProfile = [[-6, 4.6], [-4.8, 5.4], [-3.4, 5.4], [-3.4, 4.3], [3.4, 4.3], [3.4, 5.4], [4.8, 5.4], [6, 4.6]].map(([s, r]) => [yc + s, r]);
    for (const x of [-30, 0, 30]) turned(piece, FY(x, T.belt + 5.4), rollerProfile, { tone: "mid" }, opt({ name: `${piece}.roller`, hub: 1.6, bolts: 4, boltR: 2.6 }));
    // front idler with centre guide rib
    const idler = [[-6, 10.6], [-5, 11.8], [-1.6, 11.8], [-1.6, 12.4], [1.6, 12.4], [1.6, 11.8], [5, 11.8], [6, 10.6]].map(([s, r]) => [yc + s, r]);
    turned(piece, FY(T.front, zc), idler, { tone: "mid" }, opt({ name: `${piece}.idler`, hub: 3.6, bolts: 6, boltR: 6.4 }));
    // tensioner: rod and spring from the idler yoke back into the frame
    const coil = k.coil(30, 45, [yc, zc], 3.2, 6, "x", P);
    put(piece, [37, yc, zc], L(coil.back, { tone: "lo" }), [], { bias: -0.2, name: `${piece}.spring.back`, spread: sp });
    X.rodBetween(piece, [28, yc, zc], [T.front - 4, yc, zc], 1.4, { tone: "hi" }, opt({ name: `${piece}.tension` }));
    put(piece, [37, yc, zc], L(coil.front, { tone: "mid" }), [], { bias: 0.2, name: `${piece}.spring.front`, spread: sp });
    // rear sprocket: core plate plus teeth
    const SP = FY(T.rear, zc);
    turned(piece, SP, [[yc - 2.2, 9], [yc + 2.2, 9]], { tone: "mid" }, opt({ name: `${piece}.sprocket`, hub: 5.5, bolts: 9, boltR: 7.2 }));
    const TEETH = 13;
    for (let i = 0; i < TEETH; i++) {
      const a = (i / TEETH) * Math.PI * 2;
      const w0 = 0.2, w1 = 0.09;
      const tooth = [[9 * Math.cos(a - w0), 9 * Math.sin(a - w0)], [12.3 * Math.cos(a - w1), 12.3 * Math.sin(a - w1)], [12.3 * Math.cos(a + w1), 12.3 * Math.sin(a + w1)], [9 * Math.cos(a + w0), 9 * Math.sin(a + w0)]].map(([x, z]) => [T.rear + x, zc + z]);
      prism(piece, FYo, tooth, yc - 2.2, yc + 2.2, { tone: "mid" }, opt({ name: `${piece}.tooth` }));
    }
    // travel motor: stepped housing bolted to the frame, facing inward
    const MF = FY(T.rear, zc, 0, -side);
    const m0 = -side * (yc - side * 2.2);
    const motor = [[0, 9.6], [1.6, 9.6], [1.6, 8.8], [4.6, 8.8], [4.6, 7.8], [7.6, 7.8], [7.6, 5.2], [9.4, 5.2]].map(([s, r]) => [m0 + s, r]);
    turned(piece, MF, motor, { tone: "hi" }, opt({ name: `${piece}.motor`, bolts: 8, boltR: 3.8, hub: 2, seams: [m0 + 4.6], seamR: 8.8 }));
    // motor cover (the "closed" motor), bolted to the frame
    const c0 = m0 + 9.8, c1 = m0 + 11.6;
    const coverPoly = [[-13, -12], [9, -12], [14, -6], [14, 9], [7, 14], [-13, 14]].map(([x, z]) => [x, z]);
    const CF = G.frameOf([T.rear, 0, zc], [0, -side, 0], [1, 0, 0], [0, 0, 1]);
    const cs = (s) => s;
    prism(cover, CF, coverPoly, cs(c0), cs(c1), { tone: "mid" }, { name: `${cover}.plate`, spread: sp,
      extra: Dots([[-10, -9], [10, -9], [-10, 11], [8, 10]].map(([x, z]) => at(G.add3(G.add3(CF.o, G.mul3(CF.a, G.dot3(CF.a, V) > 0 ? c1 : c0)), [x, 0, z]))), { size: 0.55, tone: "hi" }) });
    // hoses from the motor into the centre frame swivel (they leave with the track)
    for (const dz of [-2.6, 2.6]) hose(piece, [[T.rear + 7.8, side * 35, zc + dz], [-38, side * 35, zc + dz], [-31, side * 24, 20 + dz], [-29, side * 22.4, 20 + dz]], 1.05, { bend: 3, free: [false, true], tone: "lo" });
    // belt with lugs
    belt.forEach(({ poly, kind, cx, a }, i) => {
      let inner = "";
      if (kind === "top") {
        const lugs = [];
        for (let x = T.rear + 3; x <= T.front - 2; x += 6.5) lugs.push(k.segment([x, lo + 1.2, zc + T.r], [x + 2.4, yc, zc + T.r], P) + k.segment([x + 2.4, yc, zc + T.r], [x, hi - 1.2, zc + T.r], P));
        inner = L(lugs.join(""), { tone: "faint", free: true });
      } else if (kind === "arc") {
        const n = [Math.cos(a), 0, Math.sin(a)];
        if (G.dot3(n, V) > 0.05) {
          const p = [cx + T.r * Math.cos(a), 0, zc + T.r * Math.sin(a)];
          inner = L(k.segment([p[0], lo + 1, p[2]], [p[0], hi - 1, p[2]], P), { tone: "faint", free: true });
        }
      }
      // tread blocks on the visible side face
      const ticks = [];
      if (kind === "top" || kind === "bottom") {
        const z0 = kind === "top" ? zc + T.r : 0, z1 = kind === "top" ? zc + T.r - 1.8 : 1.8;
        for (let x = T.rear + 3; x <= T.front - 2; x += 6.5) ticks.push(k.segment([x, faceY, z0], [x, faceY, z1], P));
      }
      if (ticks.length) inner += L(ticks.join(""), { tone: "faint" });
      prism(piece, FYo, poly, lo, hi, { tone: "lo" }, opt({ name: `${piece}.belt${i}`, inner }));
    });
    // telescopic beams and cylinder slide out of the centre frame
    const beams = [[-24, 4.6, "beam"], [24, 4.6, "beam"], [0, 2.4, "cyl"]];
    for (const [x, r, kind] of beams) {
      const y0 = side * 25.5;
      const F = G.frameOf([x, y0, 22], [0, side, 0], [1, 0, 0], [0, 0, 1]);
      const len = Math.abs(yc - side * 7 - y0);
      const stroke = SPREAD + Math.abs(X.PIECES[piece].move[1]);
      const R0 = G.rodOut(F, 0, len, r, P, { stroke });
      const id = `clip-${piece}-${kind}-${x}`;
      put(piece, [x, (y0 + yIn) / 2, 22], `<clipPath id="${id}"><path data-hold d="${R0.clip}"/></clipPath><g clip-path="url(#${id})">${S(R0.paths, { tone: kind === "cyl" ? "hi" : "mid", crease: "none" })}</g>`, [A.slide(F, 0, len, r, { name: `${piece}.${kind}` })], { name: `${piece}.${kind}`, hold: id, spread: sp });
    }
  }

  // ---------- blade ----------
  const BW = 55;
  const board = [[[84, 1], [93, 0], [92, 9], [85, 9]], [[85, 9], [92, 9], [91.5, 19], [84.5, 20]], [[84.5, 20], [91.5, 19], [94, 28], [87, 30]]];
  board.forEach((poly, i) => prism("blade", FYo, poly, -BW, BW, { tone: "mid" }, { name: `blade.board${i}` }));
  prism("blade", FYo, [[92.6, -0.4], [97, 0], [96.2, 3.4], [92.3, 3.4]], -BW, BW, { tone: "hi" }, { name: "blade.edge",
    extra: Dots(Array.from({ length: 9 }, (_, i) => at([96.6, -BW + 6 + i * 12.25, 1.8])), { size: 0.45, tone: "lo" }) });
  for (const y of [-40, -14, 14, 40]) prism("blade", FYo, [[78, 4], [85, 3], [84.5, 27], [80, 26]], y - 1.2, y + 1.2, { tone: "lo" }, { name: "blade.rib" });
  // blade arms on pins in the frame lugs
  for (const side of [1, -1]) {
    prism("blade", FYo, [[36.6, 17], [40, 16], [84, 10], [84, 21], [40, 26]], side > 0 ? 20.6 : -25.4, side > 0 ? 25.4 : -20.6, { tone: "lo" }, { name: "blade.arm" });
    const f = side > 0 ? 27.4 : -27.4;
    if ((side > 0) === (V[1] > 0)) pinY("blade", 40, 21, f, f + side * 1.6, 2.2, { tone: "hi" }, { name: "blade.pin" });
  }
  // widened blade ends, bolted on when the tracks are spread
  for (const side of [1, -1]) {
    const y0 = side * (BW - SPREAD), y1 = side * BW;
    board.forEach((poly, i) => prism("blade", FYo, poly, Math.min(y0, y1), Math.max(y0, y1), { tone: "mid" }, { name: `blade.wing${i}`, spread: [0, side * SPREAD, 0], bias: -0.6 }));
  }
  for (const side of [1, -1]) {
    const y0 = side > 0 ? 3 : -4.4, y1 = side > 0 ? 4.4 : -3;
    prism("center", FYo, [[38, 21], [42.5, 21], [47.6, 29], [43, 33.4], [38, 31]], y0, y1, { tone: "lo" }, { name: "center.cyllug" });
    prism("blade", FYo, [[78.6, 20], [84.5, 20], [84.4, 28.4], [79.6, 28.4]], side > 0 ? 2.5 : -3.9, side > 0 ? 3.9 : -2.5, { tone: "lo" }, { name: "blade.cyllug" });
  }
  hydraulic("blade", [44, 0, 29], [82, 0, 24], { rb: 3.6, rr: 1.9, frac: 0.56, name: "blade.cyl", bias: 0.2 });
  const fy = V[1] > 0 ? 1 : -1;
  pinY("center", 44, 29, fy * 4.4, fy * 5.8, 1.7, { tone: "hi" }, { name: "center.cylpin" });
  pinY("blade", 82, 24, fy * 3.9, fy * 5.3, 1.5, { tone: "hi" }, { name: "blade.cylpin" });
}
