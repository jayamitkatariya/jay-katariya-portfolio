import { PATCH, type Cue, type Layer } from './patch';

// The one path to the speakers. Every cue goes through `play`, which is the only
// place the per-play detune wander and velocity variance live.

type AnyAudioContext = typeof AudioContext;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let volume = 0.4;

const AC = (): AnyAudioContext | undefined =>
  typeof window === 'undefined'
    ? undefined
    : window.AudioContext ?? (window as unknown as { webkitAudioContext?: AnyAudioContext }).webkitAudioContext;

function ensure(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = AC();
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);
  return ctx;
}

/**
 * Browsers hold audio until the page has been interacted with. Called on every
 * gesture: the first one creates and resumes the context, and that gesture itself
 * stays silent because resuming is async. No warm-up trick, no banner.
 */
export function unlock() {
  if (!enabled) return;
  const c = ensure();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function setEnabled(on: boolean) {
  enabled = on;
}

export function setVolume(v: number) {
  volume = v;
  if (master && ctx) master.gain.setTargetAtTime(v, ctx.currentTime, 0.01);
}

/** a hidden tab has nothing to say; let the OS reclaim the audio device */
export function suspend() {
  if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
}

/** back on the tab: resume only a context that a gesture already started */
export function wake() {
  if (enabled && ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export interface PlayOptions {
  /** 0–1 multiplier on the patch gain (ghost/link presses use 0.75) */
  velocity?: number;
}

// test hook: set `window.__soundLog = []` and every cue requested is recorded, so the
// vocabulary can be asserted without ears (it costs one property read otherwise)
declare global {
  interface Window {
    __soundLog?: { cue: Cue; velocity: number; t: number }[];
  }
}

export function play(cue: Cue, { velocity = 1 }: PlayOptions = {}) {
  if (!enabled) return;
  if (window.__soundLog) window.__soundLog.push({ cue, velocity, t: performance.now() });
  const c = ctx;
  if (!c || !master || c.state !== 'running') return;
  const p = PATCH[cue];
  // one-sided: a cue is only ever softer than designed, never louder
  const vel = velocity * (0.9 + Math.random() * 0.1);
  const cents = (Math.random() * 2 - 1) * p.wander;
  const t0 = c.currentTime + 0.002;
  for (const layer of p.layers) voice(c, master, layer, t0 + (layer.delay ?? 0), vel, cents);
}

function voice(c: AudioContext, out: AudioNode, l: Layer, t: number, vel: number, cents: number) {
  const osc = c.createOscillator();
  osc.type = l.type;
  osc.detune.value = cents;

  const start = typeof l.freq === 'number' ? l.freq : l.freq.start;
  const end = typeof l.freq === 'number' ? l.freq : l.freq.end;
  const peakAt = t + l.attack;
  const decayEnd = peakAt + l.decay;
  const sustain = l.sustain ?? 0;
  const stopAt = decayEnd + (sustain > 0 ? (l.release ?? 0.05) : (l.release ?? 0)) + 0.02;

  osc.frequency.setValueAtTime(start, t);
  if (end !== start) osc.frequency.exponentialRampToValueAtTime(end, decayEnd);

  let mod: OscillatorNode | null = null;
  if (l.fm) {
    mod = c.createOscillator();
    mod.frequency.value = start * l.fm.ratio;
    const depth = c.createGain();
    depth.gain.value = l.fm.depth;
    mod.connect(depth).connect(osc.frequency);
  }

  const env = c.createGain();
  const peak = Math.max(0.0001, l.gain * vel);
  env.gain.setValueAtTime(0.0001, t);
  if (l.attack > 0) env.gain.linearRampToValueAtTime(peak, peakAt);
  else env.gain.setValueAtTime(peak, t);
  if (sustain > 0) {
    env.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sustain), decayEnd);
    env.gain.exponentialRampToValueAtTime(0.0001, decayEnd + (l.release ?? 0.05));
  } else {
    env.gain.exponentialRampToValueAtTime(0.0001, decayEnd);
  }

  let node: AudioNode = osc;
  if (l.filter) {
    const f = c.createBiquadFilter();
    f.type = l.filter.type;
    f.frequency.value = l.filter.frequency;
    if (l.filter.q) f.Q.value = l.filter.q;
    node = node.connect(f);
  }
  node.connect(env).connect(out);

  osc.start(t);
  osc.stop(stopAt);
  mod?.start(t);
  mod?.stop(stopAt);
  osc.onended = () => {
    osc.disconnect();
    mod?.disconnect();
    env.disconnect();
  };
}

/**
 * The single escape hatch for things that are not elements: the city canvas
 * only knows a bird actually left once its spawn succeeded.
 */
export const SOUND_EVENT = 'ui:sound';
export function emitSound(cue: Cue) {
  window.dispatchEvent(new CustomEvent<Cue>(SOUND_EVENT, { detail: cue }));
}
