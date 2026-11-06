// The whole sound vocabulary of the site, as synth patches. Ten cues, one
// instrument: sine for the cleanest things, triangle where a note needs body,
// presses around 1–1.5kHz, surfaces an octave and a half lower, nothing that
// fires on every press above 0.2 of full scale. Every cue is short; only the
// theme swap is allowed to ring. See ~/Documents/KOBRA-SYSTEMS/ui-sound-design.

export type Wave = 'sine' | 'triangle' | 'square';

export interface Layer {
  type: Wave;
  /** Hz, or a sweep from start to end over the note */
  freq: number | { start: number; end: number };
  /** frequency modulation: modulator at freq * ratio, depth in Hz */
  fm?: { ratio: number; depth: number };
  filter?: { type: BiquadFilterType; frequency: number; q?: number };
  attack: number;
  decay: number;
  /** level held after the decay, as a fraction of peak (only the ring uses it) */
  sustain?: number;
  release?: number;
  gain: number;
  /** seconds after the cue starts */
  delay?: number;
}

export interface Patch {
  layers: Layer[];
  /** random detune wander per play, in cents */
  wander: number;
}

const patches = {
  // The sound of the site: a 20ms click whose FM sidebands give it the
  // inharmonic edge of two things meeting. Every plain button and link.
  tap: {
    wander: 28,
    layers: [{ type: 'sine', freq: 1300, fm: { ratio: 0.5, depth: 100 }, attack: 0, decay: 0.018, release: 0.005, gain: 0.15 }],
  },
  // Choosing among siblings (a page in the nav, a filter chip, the next photo):
  // the same click pitched up with a little triangle body, so a menu is lighter
  // than a button.
  pick: {
    wander: 22,
    layers: [{ type: 'triangle', freq: 1560, fm: { ratio: 0.5, depth: 60 }, attack: 0.001, decay: 0.045, gain: 0.12 }],
  },
  // One sweep, two directions: up for on, down (and a hair quieter) for off.
  toggleOn: {
    wander: 12,
    layers: [{ type: 'sine', freq: { start: 520, end: 880 }, attack: 0.002, decay: 0.08, gain: 0.2 }],
  },
  toggleOff: {
    wander: 12,
    layers: [{ type: 'sine', freq: { start: 780, end: 420 }, attack: 0.002, decay: 0.08, gain: 0.18 }],
  },
  // Surfaces (menu, project row, dialog, photo) swell up to open and settle
  // down to close, low-passed so they sit behind the sharper presses.
  open: {
    wander: 10,
    layers: [
      { type: 'triangle', freq: { start: 320, end: 620 }, filter: { type: 'lowpass', frequency: 2600 }, attack: 0.006, decay: 0.13, gain: 0.2 },
    ],
  },
  close: {
    wander: 10,
    layers: [
      { type: 'triangle', freq: { start: 560, end: 300 }, filter: { type: 'lowpass', frequency: 2200 }, attack: 0.004, decay: 0.11, gain: 0.18 },
    ],
  },
  // Two identical blips 40ms apart, the way a shutter sounds. Plays only once
  // the clipboard actually took the text.
  copy: {
    wander: 6,
    layers: [
      { type: 'sine', freq: 1180, attack: 0.001, decay: 0.03, gain: 0.12 },
      { type: 'sine', freq: 1180, attack: 0.001, decay: 0.03, gain: 0.12, delay: 0.04 },
    ],
  },
  // An achievement: two triangle notes climbing a fifth (G5 → D6).
  success: {
    wander: 5,
    layers: [
      { type: 'triangle', freq: 784, attack: 0.003, decay: 0.16, gain: 0.13 },
      { type: 'triangle', freq: 1175, attack: 0.003, decay: 0.2, gain: 0.13, delay: 0.085 },
    ],
  },
  // The room changing: light to dark and back. The only cue allowed to ring,
  // two notes a fifth apart (C5, G5), about half a second.
  notify: {
    wander: 3,
    layers: [
      { type: 'triangle', freq: 523, attack: 0.008, decay: 0.26, sustain: 0.025, release: 0.1, gain: 0.12 },
      { type: 'triangle', freq: 784, attack: 0.008, decay: 0.28, sustain: 0.025, release: 0.12, gain: 0.1, delay: 0.12 },
    ],
  },
  // A bird leaves the sky for a rooftop: two tiny rising flicks, the lightest
  // thing in the set, so a run of clicks on the sky never turns into an aviary.
  chirp: {
    wander: 24,
    layers: [
      { type: 'sine', freq: { start: 1500, end: 1950 }, attack: 0.001, decay: 0.028, gain: 0.07 },
      { type: 'sine', freq: { start: 1650, end: 2100 }, attack: 0.001, decay: 0.03, gain: 0.06, delay: 0.055 },
    ],
  },
} satisfies Record<string, Patch>;

export type Cue = keyof typeof patches;
export const PATCH: Record<Cue, Patch> = patches;

export const isCue = (name: string | null | undefined): name is Cue =>
  !!name && Object.prototype.hasOwnProperty.call(PATCH, name);
