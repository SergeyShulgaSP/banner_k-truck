// Swing bracket, boom, stick, bucket linkage and bucket (after Rippa R18 A002, F001–F004, L001–L004).
// Every point is passed through rp(), a turn about the two vertical swing pins, so the whole
// front can be rebuilt at any swing angle. Joints are clevises: a part that turns on a pin sits
// between two cheek plates of its neighbour, so nothing is sunk into anything. Units: 1 = 10 mm.
export const PIVOT = [63, 0];
export const SWING_BASE = [12, -36, 37];

export function boom(X, theta = 0) {
  const { k, G, P, V, S, L, Dots, at, put, prism, turned, hydraulic, hose, vcyl } = X;
  const c = Math.cos(theta), s = Math.sin(theta);
  const rz = (v) => [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
  const rp = (p) => { const q = rz([p[0] - PIVOT[0], p[1] - PIVOT[1], p[2]]); return [q[0] + PIVOT[0], q[1] + PIVOT[1], q[2]]; };
  const FYr = (x = 0, z = 0) => G.frameOf(rp([x, 0, z]), rz([0, 1, 0]), rz([1, 0, 0]), [0, 0, 1]);
  const F0 = FYr();
  const side = G.dot3(F0.a, V) > 0 ? 1 : -1;
  const pinAxis = rz([0, 1, 0]);
  // a pin end showing on the visible face at |y| = face
  const boss = (piece, x, z, face, r, tone = "hi", name = "pin") => turned(piece, FYr(x, z), side > 0 ? [[face, r], [face + 1.4, r]] : [[-face - 1.4, r], [-face, r]], { tone }, { name, hub: r * 0.42 });
  // a pair of cheek plates at |y| in [a, b]
  const cheeks = (piece, poly, a, b, style, name) => { for (const sg of [1, -1]) prism(piece, F0, poly, sg > 0 ? a : -b, sg > 0 ? b : -a, style, { name }); };
  const unit2 = (v) => { const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l]; };
  const nOf = (a, b) => { const d = unit2([b[0] - a[0], b[1] - a[1]]); return [-d[1], d[0]]; };
  const along = (a, b, t, h) => { const n = nOf(a, b); return [a[0] + (b[0] - a[0]) * t + n[0] * h, a[1] + (b[1] - a[1]) * t + n[1] * h]; };
  const circle = (p, r, n = 14) => Array.from({ length: n }, (_, i) => [p[0] + r * Math.cos((i / n) * 2 * Math.PI), p[1] + r * Math.sin((i / n) * 2 * Math.PI)]);
  // two straight legs a→m→b meeting on the bisector, as two convex prisms sharing one face
  function legs(piece, a, m, b, ha, hm, hb, half, names, insets) {
    const n1 = nOf(a, m), n2 = nOf(m, b);
    const nb = unit2([n1[0] + n2[0], n1[1] + n2[1]]);
    const cosh = nb[0] * n1[0] + nb[1] * n1[1];
    const jo = [m[0] + nb[0] * hm / cosh, m[1] + nb[1] * hm / cosh], ji = [m[0] - nb[0] * hm / cosh, m[1] - nb[1] * hm / cosh];
    const p1 = [[a[0] + n1[0] * ha, a[1] + n1[1] * ha], jo, ji, [a[0] - n1[0] * ha, a[1] - n1[1] * ha]];
    const p2 = [jo, [b[0] + n2[0] * hb, b[1] + n2[1] * hb], [b[0] - n2[0] * hb, b[1] - n2[1] * hb], ji];
    const face = side * half;
    const onFace = (p) => G.add3(G.add3(F0.o, G.mul3(F0.a, face)), G.add3(G.mul3(F0.u, p[0]), G.mul3(F0.v, p[1])));
    const seamOn = (p, q, inset) => {
      if (!inset) return "";
      const n = nOf(p, q);
      return [1, -1].map((sg) => k.segment(onFace([p[0] + n[0] * inset * sg, p[1] + n[1] * inset * sg]), onFace([q[0] + n[0] * inset * sg, q[1] + n[1] * inset * sg]), P)).join("");
    };
    prism(piece, F0, p1, -half, half, { tone: "hi" }, { name: names[0], inner: insets ? L(seamOn(a, m, insets[0]), { tone: "faint" }) : "" });
    prism(piece, F0, p2, -half, half, { tone: "hi" }, { name: names[1], inner: insets ? L(seamOn(m, b, insets[1]), { tone: "faint" }) : "" });
  }

  // ---------- swing bracket: back block on the pins, two cheeks carrying the boom foot ----------
  prism("swing", F0, [[63, 40], [70, 40], [70, 76], [63, 72]], -10, 10, { tone: "hi" }, { name: "swing.block" });
  cheeks("swing", [[70, 40], [76, 41], [84, 52], [84, 66], [80, 72], [70, 76]], 7.2, 10, { tone: "hi" }, "swing.cheek");
  // lug plates for the boom cylinder base on top of the block
  cheeks("swing", [[63.6, 72.2], [70, 75.4], [74, 82], [70, 87.6], [64.6, 84]], 3.5, 4.9, { tone: "hi" }, "swing.cyllug");
  // swing-cylinder lug under the block
  prism("swing", G.frameOf(rp([0, 0, 0]), [0, 0, 1], rz([1, 0, 0]), rz([0, 1, 0])), [[64, -15.4], [72, -15.4], [72, -9.4], [64, -9.4]], 33.4, 40, { tone: "mid" }, { name: "swing.lug" });
  for (const z of [33.6, 76]) vcyl("swing", PIVOT[0], 0, 3.4, z, z + 2.4, { tone: "hi" }, { name: "swing.pincap", top: 1.4, steps: 24 });
  hydraulic("swing", SWING_BASE, rp([68, -12.4, 37]), { rb: 2.4, rr: 1.4, frac: 0.6, pin: [0, 0, 1], eye: 1.1, width: 3, name: "swing.cyl", bias: 0.2 });

  // ---------- boom ----------
  const B0 = [78, 60], B1 = [118, 152], B2 = [162, 170];
  const d2 = unit2([B2[0] - B1[0], B2[1] - B1[1]]);
  const tipEnd = [B2[0] - d2[0] * 9, B2[1] - d2[1] * 9];
  legs("boom", B0, B1, tipEnd, 7, 10, 7, 7, ["boom.lower", "boom.upper"], [4.6, 4.2]);
  // boom tip clevis around the stick
  cheeks("boom", [...circle(B2, 7.4), [tipEnd[0] - d2[1] * 7, tipEnd[1] + d2[0] * 7], [tipEnd[0] + d2[1] * 7, tipEnd[1] - d2[0] * 7]], 6.2, 7, { tone: "hi" }, "boom.tip");
  boss("boom", B0[0], B0[1], 10, 4.4, "hi", "boom.footpin");
  boss("boom", B2[0], B2[1], 7, 3.6, "hi", "stick.pin");
  // lugs for the boom cylinder rod and the arm cylinder base
  const BL = along(B0, B1, 0.6, 7 + 3 * 0.6 + 4.9), AL = along(B1, B2, 0.2, 9.4 + 5.6);
  cheeks("boom", [...circle(BL, 4.6), along(B0, B1, 0.52, 8), along(B0, B1, 0.68, 8.6)], 3.2, 4.6, { tone: "hi" }, "boom.lug");
  cheeks("boom", [...circle(AL, 5.2), along(B1, B2, 0.1, 9.6), along(B1, B2, 0.32, 9)], 3.2, 4.6, { tone: "hi" }, "boom.armlug");
  boss("boom", BL[0], BL[1], 4.6, 2.2, "hi", "boom.lugpin");
  boss("boom", AL[0], AL[1], 4.6, 2.4, "hi", "boom.armpin");
  put("boom", rp([B0[0], side * 10.5, B0[1]]), Dots([at(rp([B0[0] + 3.6, side * 10, B0[1] + 3.2]))], { size: 0.65, tone: "hi" }), [], { bias: 0.6, name: "boom.nipple" });

  // ---------- stick: top clevis for the arm cylinder, body down to the bucket ----------
  const S0 = [150, 192], S1 = [184, 98];
  const topEnd = [S0[0] + (B2[0] - S0[0]) * 0.28, S0[1] + (B2[1] - S0[1]) * 0.28];
  legs("boom", topEnd, B2, S1, 6, 7.6, 5, 6, ["stick.top", "stick.body"], [0, 3.4]);
  cheeks("boom", [...circle(S0, 5.6), along(S0, B2, 0.36, 6), along(S0, B2, 0.36, -6)], 2.6, 6, { tone: "hi" }, "stick.clevis");
  boss("boom", S0[0], S0[1], 6, 2.2, "hi", "stick.toppin");
  const BC = along(B2, S1, 0.13, 7.4 + 5);
  cheeks("boom", [...circle(BC, 4.8), along(B2, S1, 0.05, 7.4), along(B2, S1, 0.22, 7)], 2.8, 4.2, { tone: "hi" }, "stick.lug");
  boss("boom", BC[0], BC[1], 4.2, 2, "hi", "stick.lugpin");

  // ---------- bucket linkage ----------
  const LK = along(B2, S1, 0.82, 0), J = [196, 110], BK = [197, 96];
  cheeks("boom", [...circle(LK, 2.8, 10), ...circle(J, 2.8, 10)], 6.2, 7.6, { tone: "mid" }, "link.arm");
  cheeks("boom", [...circle(J, 3, 10), ...circle(BK, 3, 10)], 8, 9.4, { tone: "mid" }, "link.h");
  boss("boom", LK[0], LK[1], 7.6, 1.8, "hi", "link.pin");
  boss("boom", J[0], J[1], 9.4, 2, "hi", "link.jpin");

  // ---------- bucket: shell between two side plates, ears up to the pins ----------
  const BW = 16;
  const sidePoly = [[175, 93], [198, 90], [201, 82], [191, 61], [176, 59], [170, 74]];
  prism("boom", F0, [[176, 92], [197, 89], [200, 82], [190, 62], [176, 60], [171, 74]], -BW, BW, { tone: "mid" }, { name: "bucket.shell" });
  for (const sg of [1, -1]) prism("boom", F0, sidePoly, sg > 0 ? BW : -BW - 1.2, sg > 0 ? BW + 1.2 : -BW, { tone: "hi" }, { name: "bucket.side" });
  prism("boom", F0, [[172, 58.6], [190, 60], [191.2, 62.4], [173, 61.6]], -BW, BW, { tone: "hi" }, { name: "bucket.edge" });
  for (const y of [-11, -3.6, 3.6, 11]) {
    prism("boom", F0, [[171.2, 61.4], [176, 61.6], [170.6, 56.4], [168.8, 57]], y - 2, y + 2, { tone: "hi" }, { name: "bucket.adapter" });
    prism("boom", F0, [[168.8, 57], [170.6, 56.4], [166.6, 52.6], [165.6, 53.2]], y - 1.6, y + 1.6, { tone: "hi" }, { name: "bucket.tooth" });
  }
  cheeks("boom", [[176.6, 92.8], [197, 89.6], [200.4, 96], [197, 101], [185, 102], [180.4, 98]], 9.6, 11.6, { tone: "mid" }, "bucket.ear");
  boss("boom", S1[0], S1[1], 11.6, 2.4, "hi", "bucket.pin");
  boss("boom", BK[0], BK[1], 11.6, 2.1, "hi", "bucket.linkpin");

  // ---------- cylinders ----------
  hydraulic("boom", rp([70, 0, 82]), rp([BL[0], 0, BL[1]]), { rb: 4.4, rr: 2.3, frac: 0.58, pin: pinAxis, name: "boom.cyl", bias: -0.6 });
  hydraulic("boom", rp([AL[0], 0, AL[1]]), rp([S0[0], 0, S0[1]]), { rb: 3.8, rr: 2, frac: 0.6, pin: pinAxis, name: "arm.cyl", bias: 0.3 });
  hydraulic("boom", rp([BC[0], 0, BC[1]]), rp([J[0], 0, J[1]]), { rb: 3.4, rr: 1.8, frac: 0.55, pin: pinAxis, name: "bucket.cyl", bias: 0.4 });
  boss("swing", 70, 82, 4.9, 2.4, "hi", "swing.cylpin");

  // ---------- hoses along the convex back of the boom ----------
  const lane = [along(B0, B1, 0.14, 10.6), along(B0, B1, 0.78, 13), along(B1, B2, 0.42, 13.6)];
  for (const [dy, end] of [[-1.8, along(B1, B2, 0.62, 12.6)], [1.8, along(S0, B2, 0.5, 9.4)]]) {
    const pts = [...lane, end].map(([x, z]) => rp([x, dy, z]));
    hose("boom", pts, 0.95, { bend: 6, tone: "lo" });
  }
}
