import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import * as AUDIT from "./kit/audit.mjs";
import { tubePieces, tubeSvg } from "./kit/tube.mjs";

// Drawing helpers bound to one projection and recorder. Every helper puts one sorted item
// with its true recorded shape, so the painter's keys can be settled from geometry.
export function makeParts(P, R, PIECES, A = AUDIT) {
  const V = G.viewOf(P);
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const Dots = (points, style) => k.dotsSvg(points, style);
  const seen = (n) => G.dot3(n, V) > 0.02;

  const put = (piece, ref, svg, shapes = [], { bias = 0, name, hold = null, spread = null } = {}) => {
    const item = R.put({ piece, at: ref, bias, svg, move: PIECES[piece].move, shapes: shapes.filter(Boolean).map((s) => R.solid(s)), name: name ?? R.nameFor(`${piece}.item`) });
    if (hold) item.hold = hold;
    if (spread) item.spread = spread;
    return item;
  };

  const FY = (x = 0, z = 0, y = 0, dir = 1) => G.frameOf([x, y, z], [0, dir, 0], [1, 0, 0], [0, 0, 1]);
  const FX = (y = 0, z = 0, x = 0, dir = 1) => G.frameOf([x, y, z], [dir, 0, 0], [0, 1, 0], [0, 0, 1]);
  const FZ = (x = 0, y = 0, z = 0) => G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const centroid = (poly) => [poly.reduce((a, p) => a + p[0], 0) / poly.length, poly.reduce((a, p) => a + p[1], 0) / poly.length];
  const pt = (F, s, x, y) => [F.o[0] + F.a[0] * s + F.u[0] * x + F.v[0] * y, F.o[1] + F.a[1] * s + F.u[1] * x + F.v[1] * y, F.o[2] + F.a[2] * s + F.u[2] * x + F.v[2] * y];

  // a convex polygon (in the frame's u,v plane) extruded along F.a from s0 to s1
  function prism(piece, F, poly, s0, s1, style = {}, o = {}) {
    const [cu, cv] = centroid(poly);
    const paths = G.prismOf(F, poly, s0, s1, P);
    return put(piece, pt(F, (s0 + s1) / 2, cu, cv), S(paths, { tone: "mid", ...style, inner: o.inner ?? "" }) + (o.extra ?? ""), [A.prism(F, poly, s0, s1, { name: o.name })], o);
  }
  // the visible end face of a prism, for lines drawn on it
  const capOf = (F, s0, s1) => (G.dot3(F.a, V) > 0 ? s1 : s0);

  function box(piece, [x0, x1], [y0, y1], [z0, z1], style = {}, o = {}) {
    const r = o.r ?? 1.2;
    const plan = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r };
    const steps = o.steps ?? 3;
    const paths = k.slabOf(plan, z0, z1 - z0, P, steps, o.bevel ?? 0.5);
    const inner = o.seams ? L(o.seams.map((z) => k.sideSeam(plan, z, P, steps)).join(""), { tone: "faint" }) : o.inner ?? "";
    return put(piece, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], S(paths, { tone: "mid", ...style, inner }) + (o.extra ?? ""), [A.slab(plan, z0, z1 - z0, { name: o.name }, steps)], o);
  }
  function floor(piece, ring, z0, z1, style = {}, o = {}) {
    const paths = k.extrude(ring, z0, z1 - z0, P, { convex: o.convex ?? true, bevel: o.bevel ?? 0.8 });
    const [cx, cy] = centroid(ring);
    const inner = o.seams ? L(o.seams.map((z) => k.ringSeam(ring, z, P)).join(""), { tone: "faint" }) : "";
    return put(piece, [cx, cy, (z0 + z1) / 2], S(paths, { tone: "mid", ...style, inner }) + (o.extra ?? ""), [A.extruded(ring, z0, z1 - z0, { name: o.name })], o);
  }
  function vcyl(piece, cx, cy, r, z0, z1, style = {}, o = {}) {
    const paths = k.cylinder(cx, cy, r, z0, z1 - z0, P, o.steps ?? 32, o.bevel ?? 0);
    let extra = o.extra ?? "";
    if (o.knurl) extra += L(k.knurl(cx, cy, r, z0 + 0.2, z1 - 0.2, o.knurl, P), { tone: "lo" });
    if (o.top) extra += L(k.ring(cx, cy, o.top, z1, P, 24), { tone: "lo" });
    return put(piece, [cx, cy, (z0 + z1) / 2], S(paths, { tone: "mid", ...style }) + extra, [A.cylinder(cx, cy, r, z0, z1 - z0, { name: o.name })], o);
  }
  // a turned part: profile [[s, r], ...] with s rising along F.a
  function turned(piece, F, profile, style = {}, o = {}) {
    const s0 = profile[0][0], s1 = profile[profile.length - 1][0];
    const paths = G.solidOf(profile, F, P, { steps: o.steps, bevel: o.bevel ?? 0 });
    let extra = o.extra ?? "";
    const face = G.dot3(F.a, V) > 0 ? s1 : s0;
    const faceR = G.dot3(F.a, V) > 0 ? profile[profile.length - 1][1] : profile[0][1];
    if (o.bolts && Math.abs(G.dot3(F.a, V)) > 0.15) extra += Dots(G.dotsOf(F, face, o.boltR ?? faceR * 0.7, o.bolts, P, { all: true }), { size: 0.45, tone: "mid" });
    if (o.hub && Math.abs(G.dot3(F.a, V)) > 0.15) extra += L(G.circleOf(F, face, o.hub, P), { tone: "lo" });
    if (o.spokes && Math.abs(G.dot3(F.a, V)) > 0.15) extra += L(G.spokesOf(F, face, o.spokes[0], o.spokes[1], o.spokes[2], P, { sweep: o.sweep ?? 0 }), { tone: "lo" });
    const inner = o.seams ? L(o.seams.map((s) => G.arcOf(F, s, o.seamR ?? profile.find((p) => p[0] >= s)[1], P)).join(""), { tone: "faint" }) : "";
    return put(piece, pt(F, (s0 + s1) / 2, 0, 0), S(paths, { tone: "mid", ...style, inner }) + extra, [A.solid(F, profile, { name: o.name })], o);
  }
  // a pin or round boss along y
  const pinY = (piece, x, z, y0, y1, r, style = {}, o = {}) => turned(piece, FY(x, z), [[Math.min(y0, y1), r], [Math.max(y0, y1), r]], { tone: "lo", ...style }, { hub: o.hub ?? r * 0.45, ...o });
  function ball(piece, c, r, style = {}, o = {}) {
    return put(piece, c, S(G.sphereOf(c, r, P), { tone: "hi", ...style }), [A.ball(c, r, { name: o.name })], o);
  }
  function rodBetween(piece, p0, p1, r, style = {}, o = {}) {
    const axis = G.sub3(p1, p0);
    const F = G.frameAlong(p0, G.unit3(axis));
    return turned(piece, F, [[0, r], [G.len3(axis), r]], { tone: "mid", crease: "none", ...style }, o);
  }
  // hydraulic cylinder from base eye p0 to rod eye p1, eyes turned along `pin`
  function hydraulic(piece, p0, p1, { rb = 4, rr = 2, frac = 0.56, pin = [0, 1, 0], eye = 1.35, width, bias = 0, name = "cyl", tone = "mid" } = {}) {
    const axis = G.unit3(G.sub3(p1, p0));
    const len = G.len3(G.sub3(p1, p0));
    const F = G.frameAlong(p0, axis);
    const w = width ?? rb * 1.5;
    const e0 = rb * eye, e1 = rr * 1.9;
    const split = len * frac;
    const barrel = [[e0 * 0.55, rb * 0.62], [e0 * 0.8, rb * 0.62], [e0 * 0.8, rb * 0.92], [e0 * 0.8 + 2, rb * 0.92], [e0 * 0.8 + 2, rb], [split - 3, rb], [split - 3, rb * 1.08], [split, rb * 1.08]];
    put(piece, G.add3(p0, G.mul3(axis, split / 2)), S(G.solidOf(barrel, F, P), { tone }) + L(G.arcOf(F, split - 3, rb, P), { tone: "faint" }), [A.solid(F, barrel, { name: `${name}.barrel` })], { bias, name: `${name}.barrel` });
    const ports = [e0 * 0.8 + 4, split - 6].map((s) => G.add3(G.add3(p0, G.mul3(axis, s)), G.mul3(G.unit3(G.cross3(axis, pin)), rb)));
    ports.forEach((c, i) => {
      const n = G.unit3(G.cross3(axis, pin));
      put(piece, c, S(G.disc(-0.2, 1.6, rb * 0.34, G.frameAlong(c, n), P), { tone: "lo" }), [A.disc(G.frameAlong(c, n), -0.2, 1.6, rb * 0.34, { name: `${name}.port`, seated: true })], { bias: bias + 0.02, name: `${name}.port${i}` });
    });
    const rodProf = [[split, rr], [len - e1 * 0.9, rr], [len - e1 * 0.9, rr * 1.15], [len - e1 * 0.55, rr * 1.15]];
    put(piece, G.add3(p0, G.mul3(axis, (split + len) / 2)), S(G.solidOf(rodProf, F, P), { tone: "hi", crease: "none" }), [A.solid(F, rodProf, { name: `${name}.rod` })], { bias: bias - 0.05, name: `${name}.rod` });
    const pinF = (c) => G.frameAlong(G.sub3(c, G.mul3(G.unit3(pin), w / 2)), G.unit3(pin));
    const eyes = [[p0, e0, w], [p1, e1, w * 0.85]];
    eyes.forEach(([c, r, ww], i) => {
      const F2 = G.frameAlong(G.sub3(c, G.mul3(G.unit3(pin), ww / 2)), G.unit3(pin));
      const face = G.dot3(F2.a, V) > 0 ? ww : 0;
      put(piece, c, S(G.disc(0, ww, r, F2, P), { tone: i ? "hi" : tone }) + L(G.circleOf(F2, face, r * 0.45, P), { tone: "lo" }), [A.disc(F2, 0, ww, r, { name: `${name}.eye${i}` })], { bias: bias + 0.04, name: `${name}.eye${i}` });
    });
    return { F, len, split };
  }
  function hose(piece, points, r = 1.1, o = {}) {
    const route = G.fillet(points, o.bend ?? 4, 7, { P, tube: r });
    const id = R.nameFor(`${piece}.hose`);
    R.route(id, route, r, { piece, move: PIECES[piece].move, limp: true, free: o.free ?? [false, false] });
    tubePieces(route, r, P, { maxLength: o.maxLength ?? 14, closed: o.closed ?? false, caps: o.caps ?? true }).forEach((part, i) =>
      put(piece, part.mid, tubeSvg(part, { tone: o.tone ?? "lo" }), [A.tube(part.points, part.radii, { name: id, limp: true })], { bias: o.bias ?? 0, name: `${id}:${i}` }),
    );
    return route;
  }
  function lines(piece, ref, d, tone = "faint", o = {}) {
    return put(piece, ref, L(d, { tone, free: o.free }), [], { bias: o.bias ?? 0.3, name: o.name });
  }

  return { V, at, S, L, Dots, seen, put, FY, FX, FZ, pt, prism, capOf, box, floor, vcyl, turned, pinY, ball, rodBetween, hydraulic, hose, lines, k, G, A };
}
