// Shared geometry for the lanyard badge, in world units. Pure math (no three.js)
// so the static fallback can mirror the 3D rest pose without pulling in the 3D chunk.

export const CARD = { w: 1.6, h: 2.25, d: 0.03, r: 0.085 };

// Two straps hang from anchors either side of an offscreen "neck" and meet at the clip ring.
export const ANCHOR_X = 1.4;
export const ANCHOR_Y = 4.3;
export const SEG_LEN = 1;
export const SEGMENTS = 3;
export const ATTACH_X = 0.05; // each strap hooks a hair either side of the ring's top

// Clip hardware, card-local y (card center = 0)
export const CLAMP = { w: 0.32, h: 0.16, y: CARD.h / 2 + 0.02 };
export const RING = { r: 0.07, tube: 0.017, y: CLAMP.y + CLAMP.h / 2 + 0.085 };
// metal cap that crimps both strap ends together; it sits on the ring
export const CRIMP = { w: 0.22, h: 0.13, d: 0.055, y: RING.y + RING.r + 0.055 };
export const CLIP_Y = CRIMP.y - 0.01; // where the straps attach: buried inside the crimp

// y > 0 lifts the camera so the card sits a little below the stage's middle, with more strap showing
export const CAMERA = { y: 0.55, z: 13, fov: 25 };
// world units visible across the stage's height
export const VIEW_H = 2 * CAMERA.z * Math.tan(((CAMERA.fov / 2) * Math.PI) / 180);

type V2 = [number, number];

/** Card center (group-local, i.e. relative to the anchor height) when both straps hang taut. */
export function restCardY() {
  const dx = ANCHOR_X - ATTACH_X;
  return -Math.sqrt((SEG_LEN * SEGMENTS) ** 2 - dx * dx) - CLIP_Y;
}

/**
 * Initial joint positions for one strap, evenly spaced on the line from its anchor to the
 * card's attach point, so every rope constraint is already satisfied on the first step.
 */
export function strapPoints(side: -1 | 1, cardX: number, cardY: number): V2[] {
  const ax = side * ANCHOR_X;
  const cx = cardX + side * ATTACH_X;
  const cy = cardY + CLIP_Y;
  return Array.from({ length: SEGMENTS }, (_, i) => {
    const t = (i + 1) / SEGMENTS;
    return [ax + (cx - ax) * t, cy * t];
  });
}
