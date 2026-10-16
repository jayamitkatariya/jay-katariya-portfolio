// Full-screen tile overlays (loading screen, page wipe) are sized once, when they
// mount. On a phone the viewport can change under them (rotation, the toolbar
// sliding back), so cover the longest side both ways, plus the toolbar's height.
export function coverGrid(tile: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const side = Math.max(w, h) + 120;
  return {
    cols: Math.ceil((touch ? side : w) / tile),
    rows: Math.ceil((touch ? side : h) / tile),
  };
}
