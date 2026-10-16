// 16×16 pixel-art frames for <PixelSprite />. `#` = ink (currentColor), `o` = accent, `.` = empty.
// Frames are composed from small stamps so every row is guaranteed to be 16 wide.

const N = 16;
type Cell = '#' | 'o' | '.';
type Grid = Cell[][];

const blank = (): Grid => Array.from({ length: N }, () => Array<Cell>(N).fill('.'));

const toFrame = (g: Grid) => g.map(row => row.join(''));

/** stamp a string pattern with its top-left at (r, c); `.` leaves the cell alone */
function stamp(g: Grid, r: number, c: number, pattern: string[]): Grid {
  pattern.forEach((line, dy) =>
    [...line].forEach((ch, dx) => {
      if (ch === '#' || ch === 'o') g[r + dy][c + dx] = ch;
    }),
  );
  return g;
}

/** set individual pixels */
function dots(g: Grid, pts: [number, number][], ch: Cell = '#'): Grid {
  pts.forEach(([r, c]) => (g[r][c] = ch));
  return g;
}

// ── runner (side view, facing right) ───────────────────────────────────────
function runnerBase(top = 0): Grid {
  const g = blank();
  stamp(g, 1 + top, 6, ['####', '####', '###o', '####']); // head, `o` is the eye
  stamp(g, 5 + top, 6, ['####', '####', '####', '####']); // torso
  return g;
}

// contact: legs fully apart, arms swinging opposite
const runStride = () => {
  const g = runnerBase();
  dots(g, [[6, 5], [7, 4], [7, 3]]); // back arm
  dots(g, [[6, 10], [5, 11], [5, 12]]); // front arm
  dots(g, [[9, 9], [10, 10], [11, 11], [12, 12], [13, 12], [13, 13]]); // front leg
  dots(g, [[9, 7], [10, 6], [11, 5], [12, 4], [13, 3], [13, 4]]); // back leg
  return g;
};

// passing: one leg planted, the other knee driving up
const runPassA = () => {
  const g = runnerBase(1);
  dots(g, [[7, 5], [7, 4], [7, 3]]);
  dots(g, [[7, 10], [7, 11], [7, 12]]);
  dots(g, [[10, 7], [11, 7], [12, 7], [13, 7], [14, 7], [14, 8]]); // planted leg
  dots(g, [[10, 9], [11, 10], [11, 11], [12, 10], [12, 9]]); // lifted knee
  return g;
};

// flight: both feet off the ground, body a pixel higher
const runAir = () => {
  const g = runnerBase(-1);
  dots(g, [[5, 5], [6, 4], [6, 3]]);
  dots(g, [[5, 10], [4, 11], [4, 12]]);
  dots(g, [[8, 9], [9, 10], [10, 11], [11, 12], [11, 13]]); // front leg reaching
  dots(g, [[8, 7], [9, 6], [10, 5], [11, 4], [11, 3]]); // back leg kicked
  return g;
};

// passing, other leg: heel flicks up behind
const runPassB = () => {
  const g = runnerBase(1);
  dots(g, [[7, 5], [7, 4], [7, 3]]);
  dots(g, [[7, 10], [7, 11], [7, 12]]);
  dots(g, [[10, 9], [11, 9], [12, 9], [13, 9], [14, 9], [14, 10]]); // planted leg
  dots(g, [[10, 7], [11, 6], [12, 5], [12, 4], [11, 4]]); // heel flick
  return g;
};

export const runner: string[][] = [runStride, runPassA, runAir, runPassB].map(f => toFrame(f()));

// ── waver (front view, waves with its right hand) ──────────────────────────
function waverBase(): Grid {
  const g = blank();
  stamp(g, 3, 5, ['.####.', '######', '#.##.#', '######', '.####.']); // head
  stamp(g, 8, 5, ['######', '######', '######', '######']); // body
  stamp(g, 12, 5, ['##..##', '##..##']); // legs
  dots(g, [[9, 4], [10, 4], [11, 4]]); // resting arm
  return g;
}

const waveUp = () => {
  const g = waverBase();
  dots(g, [[9, 11], [8, 11], [7, 12], [6, 12]]);
  dots(g, [[5, 12], [4, 12]], 'o'); // hand
  return g;
};

const waveOut = () => {
  const g = waverBase();
  dots(g, [[9, 11], [8, 12], [7, 13], [6, 14]]);
  dots(g, [[5, 14], [4, 14]], 'o');
  return g;
};

export const waver: string[][] = [waveUp, waveOut, waveUp, waveOut].map(f => toFrame(f()));

// ── bouncing mail ──────────────────────────────────────────────────────────
const ENVELOPE = [
  '############',
  '##........##',
  '#.#......#.#',
  '#..#....#..#',
  '#...####...#',
  '#..........#',
  '#..........#',
  '############',
];

const mailRest = () => stamp(blank(), 6, 2, ENVELOPE);

const mailHop = () => {
  const g = stamp(blank(), 4, 2, ENVELOPE);
  dots(g, [[0, 13], [1, 12], [1, 13], [1, 14], [2, 13]], 'o'); // sparkle
  return g;
};

export const flapMail: string[][] = [mailRest, mailHop, mailRest, mailHop].map(f => toFrame(f()));

// ── thinker (idea → lightbulb) ─────────────────────────────────────────────
function thinker(extra: (g: Grid) => void): Grid {
  const g = blank();
  stamp(g, 6, 5, ['.####.', '######', '#.##.#', '######', '.####.']); // head, eyes are cut-outs
  stamp(g, 11, 5, ['######', '######', '######']); // body
  stamp(g, 14, 5, ['##..##', '##..##']); // legs
  dots(g, [[12, 4], [13, 4]]); // resting arm
  dots(g, [[13, 11], [12, 11], [11, 11], [10, 10]]); // other hand on chin
  extra(g);
  return g;
}

const bulbOff = (g: Grid) => stamp(g, 0, 5, ['.####.', '#....#', '#....#', '.####.', '..##..']);
const bulbOn = (g: Grid) => {
  stamp(g, 0, 5, ['.oooo.', 'oooooo', 'oooooo', '.oooo.']);
  stamp(g, 4, 5, ['..##..']); // socket
};

const thinkA = () => thinker(g => dots(g, [[5, 11]]));
const thinkB = () => thinker(g => dots(g, [[5, 11], [3, 12]]));
const ideaOff = () => thinker(bulbOff);
const ideaOn = () =>
  thinker(g => {
    bulbOn(g);
    dots(g, [[1, 3], [1, 12]], 'o');
  });
const ideaGlow = () =>
  thinker(g => {
    bulbOn(g);
    dots(g, [[1, 2], [1, 3], [1, 12], [1, 13], [0, 4], [0, 11], [3, 4], [3, 11]], 'o');
  });

export const thinkerIdea: string[][] = [thinkA, thinkB, ideaOff, ideaOn, ideaGlow, ideaOn, ideaGlow, ideaOn].map(f => toFrame(f()));

// ── crab (Clawd-style, scuttles sideways; `o` eyes) ────────────────────────
function crab(lift: 0 | 1, planted: 'all' | 'a' | 'b'): Grid {
  const g = blank();
  const top = 5 - lift;
  stamp(g, top, 2, Array(8).fill('#'.repeat(12))); // body
  stamp(g, top + 4, 0, ['##', '##']); // left claw
  stamp(g, top + 4, 14, ['##', '##']); // right claw
  dots(g, [[top + 2, 4], [top + 3, 4], [top + 2, 11], [top + 3, 11]], 'o'); // eyes
  // legs in two pairs: a planted leg reaches the ground (row 14), a lifted one stops short
  const legs: [number, 'a' | 'b'][] = [[3, 'a'], [5, 'b'], [10, 'a'], [12, 'b']];
  legs.forEach(([c, pair]) => {
    const bottom = planted === 'all' || planted === pair ? 14 : 13;
    for (let r = top + 8; r <= bottom; r++) g[r][c] = '#';
  });
  return g;
}

export const crabWalk: string[][] = [
  () => crab(0, 'all'),
  () => crab(1, 'a'),
  () => crab(0, 'all'),
  () => crab(1, 'b'),
].map(f => toFrame(f()));
