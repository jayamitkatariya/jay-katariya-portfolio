import { PixelIcon } from './SectionHeading';
import { toggleSoundMuted, useSoundMuted } from '../lib/sound/store';

// One press to silence, remembered across visits and shared across tabs.
// Its own press is the last sound on the way out (`toggleOff` lands at
// pointerdown, while the engine is still on); the way back plays from
// SoundEffects once the store flips.
export default function SoundToggle({ className = '' }: { className?: string }) {
  const muted = useSoundMuted();
  return (
    <button
      type="button"
      onClick={toggleSoundMuted}
      aria-pressed={!muted}
      aria-label="sound"
      title={muted ? 'sound off (m)' : 'sound on (m)'}
      data-sound={muted ? 'none' : 'toggleOff'}
      className={`relative grid h-9 w-9 place-items-center rounded-full pointer-coarse:h-11 pointer-coarse:w-11 hover:bg-[var(--bg-secondary)] transition-[color,background-color,scale] duration-150 ease-out active:scale-[0.96] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 pointer-coarse:after:content-[''] ${className}`}
    >
      <PixelIcon name={muted ? 'mute' : 'sound'} size={14} instant />
    </button>
  );
}
