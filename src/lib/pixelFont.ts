// Tiny hand-drawn 7-row pixel font for stamping words into dither canvases.
// Rows 0–1 are ascender space, 2–6 the x-height. Only the glyphs in use are drawn;
// anything else falls back to a space.

const GLYPHS: Record<string, string[]> = {
  i: ['#', '.', '#', '#', '#', '#', '#'],
  m: ['.....', '.....', '####.', '#.#.#', '#.#.#', '#.#.#', '#.#.#'],
  h: ['#...', '#...', '###.', '#..#', '#..#', '#..#', '#..#'],
  ' ': ['..', '..', '..', '..', '..', '..', '..'],
};

export const FONT_ROWS = 7;
export const CURSOR_W = 4;

export interface PixelText {
  cols: number; // text width in font pixels, excluding the cursor slot
  bits: Uint8Array; // cols × FONT_ROWS, 1 = ink
  charStarts: number[]; // column where each character begins; last entry = end of text + gap
}

export function layoutPixelText(text: string): PixelText {
  const chars = [...text.toLowerCase()].map(ch => GLYPHS[ch] ?? GLYPHS[' ']);
  const cols = chars.reduce((sum, g) => sum + g[0].length, 0) + Math.max(0, chars.length - 1);
  const bits = new Uint8Array(cols * FONT_ROWS);
  const charStarts: number[] = [];
  let x = 0;
  for (const g of chars) {
    charStarts.push(x);
    for (let r = 0; r < FONT_ROWS; r++) {
      for (let c = 0; c < g[r].length; c++) {
        if (g[r][c] === '#') bits[r * cols + x + c] = 1;
      }
    }
    x += g[0].length + 1;
  }
  charStarts.push(x);
  return { cols, bits, charStarts };
}
