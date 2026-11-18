import * as k from "./kit/iso-kit.mjs";
import * as A from "./kit/audit.mjs";
import { makeParts } from "./parts.mjs";
import { undercarriage, TRACK, SPREAD } from "./undercarriage.mjs";
import { upper } from "./upper.mjs";
import { boom } from "./boom.mjs";

export { TRACK, SPREAD };
export const W = 1180;
export const H = 700;
export const AZIMUTH = 57;
export const ELEVATION = 27;

export const PIECES = {
  canopy: { say: "навес · высота машины 2 325 мм", move: [0, 0, 104] },
  hood: { say: "капот и задний щиток · открывают моторный отсек", move: [-6, 0, 76] },
  radiator: { say: "радиатор · водяное охлаждение двигателя", move: [0, 50, 22] },
  engine: { say: "Kubota D902 · 3 цилиндра · 11,2 кВт · гидронасос на маховике", move: [-28, 0, 40] },
  counterweight: { say: "противовес · уравновешивает стрелу с ковшом", move: [-48, 0, 0] },
  tanks: { say: "гидробак и топливный бак", move: [0, -48, 10] },
  station: { say: "сиденье, джойстики гидроуправления и рычаги хода", move: [12, 0, 44] },
  boom: { say: "стрела, рукоять и ковш 0,04 м³ · глубина копания 2 060 мм", move: [54, 0, 22] },
  swing: { say: "кронштейн поворота стрелы · копает вдоль стены и забора", move: [28, 0, 22] },
  blade: { say: "отвал с гидроцилиндром и уширителями", move: [40, 0, 0] },
  coverL: { say: "закрытые ходовые гидромоторы · крышка защищает мотор и шланги", move: [0, -24, 0] },
  coverR: { say: "закрытые ходовые гидромоторы · крышка защищает мотор и шланги", move: [0, 24, 0] },
  trackL: { say: "гусеница · гидромотор, звёздочка, катки и натяжное колесо", move: [0, 42, 0] },
  trackR: { say: "гусеница · гидромотор, звёздочка, катки и натяжное колесо", move: [0, -42, 0] },
  platform: { say: "поворотная платформа · гидрораспределитель и узел поворота стрелы", move: [0, 0, 20] },
  ring: { say: "опорно-поворотный круг · платформа вращается на 360°", move: [0, 0, 9] },
  center: { say: "рама ходовой · телескопические балки и цилиндр раздвигают гусеницы", move: [0, 0, 0] },
};

export const STAGGER = ["canopy", "hood", "counterweight", "radiator", "engine", "tanks", "station", "boom", "swing", "blade", "coverL", "coverR", "trackL", "trackR", "platform", "ring", "center"];
export const SPRING = { stagger: 0.045, stiffness: 52, damping: 13.2, substeps: 4 };

export function build() {
  const P = k.fitProjection(
    [
      [-100, -55, 0], [-100, 55, 0], [245, 0, 50], [235, -20, 0],
      [-34, -47, 330], [50, 47, 330],
      [-60, 125, 0], [70, 125, 0], [-60, -110, 0], [60, -110, 30],
      [-80, 0, 140], [258, 0, 200],
    ],
    W,
    H,
    { pad: 14, azimuth: AZIMUTH, elevation: ELEVATION },
  );
  const R = A.recorder(P, { order: STAGGER, spring: SPRING });
  const X = { ...makeParts(P, R, PIECES), P, PIECES };
  undercarriage(X);
  upper(X);
  const first = R.items.length;
  boom(X, 0);
  R.items.slice(first).forEach((item, i) => (item.b = i));
  return { P, V: X.V, R };
}
