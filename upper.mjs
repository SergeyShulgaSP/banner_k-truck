// Superstructure of the RUMM 18 (after Rippa R18 schematics A001–A012, B, C001, D001):
// slewing ring, deck with the boom-swing knuckle and the multi-way valve, counterweight,
// Kubota D902 with its gear pump on the flywheel housing, radiator, tanks, operator station,
// hood and the four-post canopy. Units: 1 = 10 mm.
export function upper(X) {
  const { k, G, P, V, S, L, Dots, at, put, FY, FX, FZ, prism, box, floor, vcyl, turned, pinY, ball, rodBetween, hose, lines } = X;
  const FYo = FY();
  const deg = Math.PI / 180;

  // ---------- slewing ring ----------
  turned("ring", FZ(0, 0, 0), [[34, 31], [37.2, 31], [37.2, 29.6], [40, 29.6]], { tone: "mid" }, { name: "ring.gear",
    extra: L(k.knurl(0, 0, 31, 34.3, 37, 140, P, 0.3), { tone: "lo" }) + Dots(G.dotsOf(FZ(0, 0, 0), 40, 25, 24, P, { all: true }), { size: 0.42, tone: "mid" }) });

  // ---------- deck ----------
  const deckRing = [[54, 46], [60, 32], [56, 16], [54, 10], [54, -10], [56, -16], [60, -32], [54, -46], ...Array.from({ length: 17 }, (_, i) => { const a = (260 - i * 10) * deg; return [52 * Math.cos(a), 50 * Math.sin(a)]; })];
  floor("platform", deckRing, 40, 48, { tone: "mid" }, { name: "platform.deck", bevel: 1, seams: [44] });
  // boom-swing knuckle with upper and lower ears
  box("platform", [46, 54], [-9, 9], [48, 72], { tone: "mid" }, { name: "platform.post", r: 1.5, seams: [60] });
  for (const z of [36, 72]) box("platform", [46, 63], [-8, 8], [z, z + 4], { tone: "mid" }, { name: "platform.ear", r: 3, steps: 4 });
  // multi-way valve with spool caps and hand linkages
  box("platform", [24, 46], [-31, -17], [48, 58], { tone: "lo" }, { name: "platform.valve", seams: [52],
    extra: Dots(Array.from({ length: 8 }, (_, i) => at([26.5 + i * 2.6, -31, 55])), { size: 0.7, tone: "hi" }) });
  for (let i = 0; i < 8; i++) vcyl("platform", 26.5 + i * 2.6, -24, 0.9, 58, 60.5, { tone: "hi" }, { name: "platform.spool", steps: 12 });
  // side guards under the hood with vent slots
  for (const side of [1, -1]) {
    const y0 = side > 0 ? 43 : -48, y1 = side > 0 ? 48 : -43;
    const fy = side > 0 ? 48 : -48;
    const slots = [];
    if ((side > 0) === (V[1] > 0)) for (let z = 54; z <= 66; z += 4) slots.push(k.segment([-24, fy, z], [-10, fy, z], P) + k.segment([-10, fy, z], [-10, fy, z + 1.6], P) + k.segment([-10, fy, z + 1.6], [-24, fy, z + 1.6], P) + k.segment([-24, fy, z + 1.6], [-24, fy, z], P));
    box("platform", [-26, -6], [y0, y1], [48, 72], { tone: "lo" }, { name: "platform.guard", r: 1, extra: L(slots.join(""), { tone: "faint" }) });
  }
  // pressure lines from the valve to the swing knuckle
  hose("platform", [[46, -20, 53], [52, -16, 53], [53, -10, 49.5]], 0.9, { bend: 2.5, tone: "lo" });
  hose("platform", [[46, -27, 53], [55, -22, 53], [57, -10, 51.5]], 0.9, { bend: 3, tone: "lo" });

  // ---------- counterweight ----------
  const cwO = [], cwI = [];
  for (let a = 128; a <= 232; a += 6) { cwO.push([55 * Math.cos(a * deg), 52 * Math.sin(a * deg)]); cwI.push([44 * Math.cos(a * deg), 42 * Math.sin(a * deg)]); }
  const cwRing = [...cwO, ...cwI.slice().reverse()];
  floor("counterweight", cwRing, 48, 72, { tone: "mid" }, { convex: false, name: "counterweight.body", bevel: 0.8, seams: [52, 68] });
  for (const a of [150, 210]) vcyl("counterweight", 50 * Math.cos(a * deg), 47 * Math.sin(a * deg), 2.4, 72, 74.5, { tone: "hi" }, { name: "counterweight.eye", top: 1.1, steps: 20 });

  // ---------- engine: Kubota D902, three cylinders in line, crank along y ----------
  const EZ = 50;
  box("engine", [-40, -10], [-18, 16], [EZ + 4, EZ + 34], { tone: "mid" }, { name: "engine.block", r: 2, seams: [EZ + 12, EZ + 22],
    extra: L([-6, 3, 12].map((y) => k.segment([-10, y, EZ + 22], [-10, y, EZ + 34], P)).join(""), { tone: "faint" }) });
  box("engine", [-36, -14], [-17, 15], [EZ, EZ + 4], { tone: "lo" }, { name: "engine.pan", r: 1.5 });
  box("engine", [-38, -12], [-16, 14], [EZ + 34, EZ + 41], { tone: "mid" }, { name: "engine.head", r: 2, seams: [EZ + 37.5] });
  box("engine", [-35, -15], [-14, 12], [EZ + 41, EZ + 46], { tone: "hi" }, { name: "engine.cover", r: 2.4, bevel: 0.6,
    extra: L([-31, -25, -19].map((x) => k.lineOnTop([x, -12], [x, 10], EZ + 46, P)).join(""), { tone: "faint" }) });
  vcyl("engine", -19, 7, 1.8, EZ + 46, EZ + 48.5, { tone: "hi" }, { name: "engine.oilcap", knurl: 12, steps: 16 });
  // injectors and their pipes from the injection pump on the front (+x) face
  const inj = [-7, 0, 7].map((y) => [-12, y - 2, EZ + 39]);
  inj.forEach((p, i) => turned("engine", X.FX(p[1], p[2], -12), [[0, 0.9], [3, 0.9]], { tone: "hi" }, { name: "engine.injector" }));
  vcyl("engine", -8.4, -9, 2.2, EZ + 16, EZ + 26, { tone: "mid" }, { name: "engine.injpump", steps: 20, top: 1 });
  box("engine", [-10, -6.4], [-12, -6], [EZ + 12, EZ + 16], { tone: "lo" }, { name: "engine.pumpbase", r: 0.6 });
  inj.forEach((p, i) => hose("engine", [[-8.4, -9, EZ + 26], [-8.4, -9 + i * 1.2, EZ + 33], [-8.4, p[1] + 0.4, EZ + 39], [-9, p[1] + 0.4, EZ + 39]], 0.45, { bend: 2, tone: "hi" }));
  // exhaust manifold to muffler, intake to air filter
  box("engine", [-44, -40], [-14, 10], [EZ + 30, EZ + 36], { tone: "lo" }, { name: "engine.exhaust", r: 1 });
  rodBetween("engine", [-42, -12, EZ + 50], [-42, 10, EZ + 50], 4.6, { tone: "lo", crease: "faint" }, { name: "engine.muffler" });
  hose("engine", [[-42, -4, EZ + 36], [-42, -4, EZ + 45.6]], 1.8, { bend: 2, tone: "mid" });
  rodBetween("engine", [-34, -30, EZ + 40], [-16, -30, EZ + 40], 5.6, { tone: "mid", crease: "faint" }, { name: "engine.airfilter" });
  hose("engine", [[-24, -24.4, EZ + 40], [-24, -16, EZ + 38]], 1.6, { bend: 2, tone: "lo" });
  // front of the crank (+y): pulleys, belt, alternator and fan
  const FAN = [-20, EZ + 20];
  turned("engine", FY(FAN[0], EZ + 12), [[16, 3.2], [18, 3.2]], { tone: "mid" }, { name: "engine.crank" });
  turned("engine", FY(-12, EZ + 40), [[16.5, 3], [18.2, 3], [18.2, 4.2], [23, 4.2]], { tone: "mid" }, { name: "engine.alternator", hub: 1.2, seams: [20.6], seamR: 4.2 });
  hose("engine", [[FAN[0] - 3.2, 17.4, EZ + 12], [FAN[0] - 3.2, 17.4, EZ + 40], [-9, 17.4, EZ + 40], [FAN[0] + 3.2, 17.4, EZ + 12]], 0.6, { bend: 3, tone: "hi", closed: true, caps: false });
  turned("engine", FY(FAN[0], FAN[1]), [[16, 2.6], [19, 2.6]], { tone: "mid" }, { name: "engine.fanhub" });
  turned("engine", FY(FAN[0], FAN[1]), [[19, 10], [19.8, 10]], { tone: "lo" }, { name: "engine.fan", spokes: [2.6, 9.6, 6], sweep: 0.5, hub: 2.6 });
  // flywheel housing (-y) with the starter and the gear pump
  turned("engine", FY(FAN[0], EZ + 18, 0, -1), [[18, 15], [22, 15], [22, 13.5], [23, 13.5]], { tone: "mid" }, { name: "engine.flywheel", bolts: 12, boltR: 13.6 });
  rodBetween("engine", [-14, -22, EZ + 8], [-14, -30, EZ + 8], 3.2, { tone: "mid" }, { name: "engine.starter" });
  turned("engine", FY(FAN[0], EZ + 18, 0, -1), [[23, 5.4], [25, 5.4], [25, 6.6], [32, 6.6], [32, 5.2], [33.6, 5.2]], { tone: "hi" }, { name: "engine.pump", hub: 2.2, bolts: 4, boltR: 3.6, seams: [25], seamR: 6.6 });
  vcyl("engine", -40, 4, 2.4, EZ + 6, EZ + 13, { tone: "hi" }, { name: "engine.oilfilter", steps: 18, top: 1 });
  for (const [x, y] of [[-36, -18.5], [-14, -18.5], [-36, 16.5], [-14, 16.5]]) box("engine", [x - 2.5, x + 2.5], [y - 1.5, y + 1.5], [EZ - 2, EZ + 4], { tone: "lo" }, { name: "engine.mount", r: 0.5 });
  // pump lines: suction from the tank, pressure to the valve (they leave with the engine)
  hose("engine", [[FAN[0], -33.6, EZ + 18], [FAN[0], -37, EZ + 18], [-8, -40, EZ + 14], [-4, -40, EZ + 14]], 2, { bend: 5, tone: "lo", free: [false, true] });
  hose("engine", [[FAN[0] + 6.6, -29, EZ + 18], [-12, -29, EZ + 6], [20, -24, EZ + 6], [24, -24, EZ + 6]], 1.2, { bend: 5, tone: "lo", free: [false, true] });

  // ---------- radiator with shroud, tanks and hoses ----------
  box("radiator", [-29, -8], [24, 30], [EZ + 4, EZ + 44], { tone: "mid" }, { name: "radiator.core", r: 1.2,
    extra: L(Array.from({ length: 10 }, (_, i) => k.segment([-27 + i * 2.1, 30, EZ + 4], [-27 + i * 2.1, 30, EZ + 44], P)).join(""), { tone: "faint" }) });
  box("radiator", [-30, -7], [23.5, 30.5], [EZ + 44, EZ + 50], { tone: "hi" }, { name: "radiator.toptank", r: 1.2 });
  box("radiator", [-30, -7], [23.5, 30.5], [EZ, EZ + 4], { tone: "hi" }, { name: "radiator.bottomtank", r: 1.2 });
  vcyl("radiator", -25, 27, 2.4, EZ + 50, EZ + 53, { tone: "hi" }, { name: "radiator.cap", knurl: 14, steps: 20 });
  turned("radiator", FY(-20, EZ + 20), [[20.4, 10.8], [23.6, 11.6]], { tone: "lo" }, { name: "radiator.shroud", hub: 10.2 });
  turned("radiator", FZ(-4, 36, EZ + 26), [[0, 3.4], [10, 3.4], [11.4, 2], [12, 1.2]], { tone: "hi" }, { name: "radiator.reservoir", bevel: 0.4 });
  hose("radiator", [[-9, 30.5, EZ + 49], [-6, 34, EZ + 51], [-4, 36, EZ + 38.5]], 0.6, { bend: 2, tone: "lo" });
  hose("engine", [[-12, 14, EZ + 36], [-10, 20, EZ + 40], [-10, 23.5, EZ + 46]], 1.6, { bend: 3, tone: "lo", free: [false, true] });
  hose("engine", [[-12, 14, EZ + 8], [-10, 20, EZ + 6], [-10, 23.5, EZ + 2]], 1.6, { bend: 3, tone: "lo", free: [false, true] });

  // ---------- tanks ----------
  box("tanks", [-4, 22], [-48, -33], [48, 94], { tone: "mid" }, { name: "tanks.hydraulic", r: 3, steps: 4, seams: [52, 90] });
  box("tanks", [2, 8], [-33.4, -32.6], [62, 84], { tone: "lo" }, { name: "tanks.sight", r: 0.4,
    extra: L(k.segment([5, -32.6, 66], [5, -32.6, 80], P), { tone: "hi" }) });
  vcyl("tanks", 6, -40, 3.4, 94, 98, { tone: "hi" }, { name: "tanks.breather", knurl: 18, steps: 24, top: 1.6 });
  vcyl("tanks", 16, -40, 2.6, 94, 96.5, { tone: "mid" }, { name: "tanks.filter", steps: 20, extra: Dots(G.dotsOf(FZ(16, -40, 0), 96.5, 2, 4, P, { all: true }), { size: 0.4 }) });
  box("tanks", [24, 40], [-48, -33], [48, 82], { tone: "mid" }, { name: "tanks.fuel", r: 3, steps: 4, seams: [52, 78] });
  vcyl("tanks", 33, -40, 3, 82, 85.5, { tone: "hi" }, { name: "tanks.fuelcap", knurl: 16, steps: 24 });
  vcyl("tanks", 29, -44, 1.6, 82, 83.4, { tone: "lo" }, { name: "tanks.sender", steps: 14, top: 0.8 });

  // ---------- operator station ----------
  box("station", [0, 24], [-15, 15], [48, 70], { tone: "lo" }, { name: "station.base", r: 2, seams: [60] });
  box("station", [2, 24], [-13, 13], [70, 76], { tone: "mid" }, { name: "station.cushion", r: 4, steps: 5, bevel: 0.8,
    extra: L(k.lineOnTop([4, -4.5], [22, -4.5], 76, P) + k.lineOnTop([4, 4.5], [22, 4.5], 76, P), { tone: "faint" }) });
  prism("station", FYo, [[1, 76], [8, 76], [5, 101], [-2, 101]], -13, 13, { tone: "mid" }, { name: "station.back" });
  prism("station", FYo, [[-2, 102], [5, 102], [4.4, 109], [-2.6, 109]], -8, 8, { tone: "mid" }, { name: "station.headrest" });
  for (const side of [1, -1]) {
    box("station", [6, 26], side > 0 ? [16, 23] : [-23, -16], [56, 70], { tone: "lo" }, { name: "station.console", r: 1.5, seams: [66] });
    box("station", [4, 18], side > 0 ? [16.5, 22.5] : [-22.5, -16.5], [70, 73], { tone: "mid" }, { name: "station.armrest", r: 1.4 });
    turned("station", FZ(22, side * 19.5, 70), [[0, 2.6], [3, 1.2]], { tone: "lo" }, { name: "station.boot" });
    rodBetween("station", [22, side * 19.5, 73], [22.8, side * 19.5, 83], 0.8, { tone: "mid" }, { name: "station.joystick" });
    ball("station", [22.9, side * 19.5, 85], 2.1, { tone: "hi" }, { name: "station.knob" });
    rodBetween("station", [40, side * 5, 49.4], [37, side * 5, 78], 0.8, { tone: "mid" }, { name: "station.travel" });
    rodBetween("station", [36.8, side * 5, 78], [36.5, side * 5, 84], 1.5, { tone: "hi" }, { name: "station.grip" });
    box("station", [42, 48], side > 0 ? [8, 14] : [-14, -8], [49.4, 51], { tone: "mid" }, { name: "station.pedal", r: 0.6 });
  }
  box("station", [28, 45.4], [-15, 15], [48, 49.4], { tone: "lo" }, { name: "station.floor", r: 1, extra: Dots(k.dotGrid(30, -13, 5, 9, 3.2, 49.4, P), { size: 0.35, tone: "lo" }) });

  // ---------- hood (orange shell over the engine) ----------
  const hoodRing = [[-6, 47], ...Array.from({ length: 17 }, (_, i) => { const a = (100 + i * 10) * deg; return [51 * Math.cos(a), 49 * Math.sin(a)]; }).filter(([x]) => x < -6), [-6, -47]];
  const gy = (x) => Math.min(47, 49 * Math.sqrt(Math.max(0, 1 - (x / 51) ** 2))) + 0.15;
  const grill = [];
  if (V[1] > 0) {
    for (const [g0, g1] of [[-34, -23], [-21, -9]]) {
      for (let z = 81; z <= 99; z += 3) grill.push(k.segment([g0, gy(g0), z], [g1, gy(g1), z], P) + k.segment([g1, gy(g1), z], [g1, gy(g1), z + 1.4], P) + k.segment([g1, gy(g1), z + 1.4], [g0, gy(g0), z + 1.4], P) + k.segment([g0, gy(g0), z + 1.4], [g0, gy(g0), z], P));
    }
  }
  floor("hood", hoodRing, 72, 106, { tone: "hi" }, { name: "hood.shell", bevel: 1.2, seams: [76, 104], extra: L(grill.join(""), { tone: "lo" }) });
  floor("hood", hoodRing.map(([x, y]) => [x * 0.95 - 0.4, y * 0.94]), 106, 111, { tone: "hi" }, { name: "hood.top", bevel: 0.9 });
  vcyl("hood", -44, 10, 1.6, 104, 106.5, { tone: "lo" }, { name: "hood.lock", steps: 14, top: 0.7 });
  rodBetween("hood", [-42, 0, 111.02], [-42, 0, 124], 1.7, { tone: "lo" }, { name: "hood.stack" });
  turned("hood", FZ(-42, 0, 124), [[0, 2.6], [1.6, 2.6]], { tone: "mid" }, { name: "hood.raincap" });

  // ---------- canopy ----------
  box("canopy", [-34, 50], [-47, 47], [216, 225], { tone: "mid" }, { name: "canopy.roof", r: 8, steps: 8, bevel: 1.4, seams: [219],
    extra: L(k.planOutline({ x: -27, y: -40, w: 70, d: 80, r: 6 }, 225, P, 8) + [-12, 6, 24].map((x) => k.lineOnTop([x, -40], [x, 40], 225, P)).join(""), { tone: "faint" }) });
  vcyl("canopy", -14, 30, 2.6, 225, 227, { tone: "mid" }, { name: "canopy.beaconbase", steps: 20 });
  turned("canopy", FZ(-14, 30, 227), [[0, 2.2], [3.6, 2.2], [4.6, 1.6, 1], [5.2, 0.6, 1]], { tone: "hi" }, { name: "canopy.beacon" });
  for (const side of [1, -1]) {
    const y0 = side > 0 ? 32 : -39, y1 = side > 0 ? 39 : -32;
    box("canopy", [-28, -17], [y0 - 1.5, y1 + 1.5], [111, 113], { tone: "mid" }, { name: "canopy.foot", r: 1, extra: Dots([[-26, y0], [-19, y1]].map(([x, y]) => at([x, y, 113])), { size: 0.5 }) });
    box("canopy", [-26, -19], [y0, y1], [113, 216], { tone: "mid" }, { name: "canopy.rearpost", r: 1.5, seams: [150] });
    box("canopy", [42, 50], [side * 41 - 4, side * 41 + 4], [48, 50], { tone: "mid" }, { name: "canopy.frontfoot", r: 1 });
    rodBetween("canopy", [46, side * 41, 50], [43, side * 41, 216], 2.2, { tone: "mid" }, { name: "canopy.frontpost" });
  }
  rodBetween("canopy", [43, -41, 212], [43, 41, 212], 1.6, { tone: "mid" }, { name: "canopy.crossbar" });
  turned("canopy", FX(36, 204, 43), [[2.2, 2], [6, 2.6], [6.6, 2.6]], { tone: "hi" }, { name: "canopy.worklight", hub: 1.6 });
}
