import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useWindowManager } from './WindowManager';
import { APP_REGISTRY } from '../data/appRegistry';

interface MenuBarProps {
  isDark: boolean;
  onToggleDark: () => void;
}

function Clock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const day = days[now.getDay()];
      const month = months[now.getMonth()];
      const date = now.getDate();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      const h = hours % 12 || 12;
      setTime(`${day} ${month} ${date}  ${h}:${minutes} ${ampm}`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  return <span className="font-mono text-[11px] tracking-wide">{time}</span>;
}

export default function MenuBar({ isDark, onToggleDark }: MenuBarProps) {
  const { state } = useWindowManager();

  const activeApp = state.activeWindowId
    ? state.windows.find(w => w.id === state.activeWindowId)
    : null;
  const activeAppName = activeApp ? APP_REGISTRY[activeApp.appId].name : '';

  return (
    <div className="absolute top-0 left-0 right-0 h-7 z-50 flex items-center justify-between px-4 bg-black/25 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/[0.08]">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <span className="font-mono text-[11px] font-bold tracking-widest text-white/90 drop-shadow-sm">jk.</span>
        {activeAppName && (
          <span className="font-mono text-[11px] font-semibold tracking-wide text-white/75">
            {activeAppName}
          </span>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 text-white/80">
        <button
          onClick={onToggleDark}
          className="p-0.5 hover:bg-white/10 rounded transition-colors"
        >
          {isDark ? <Sun size={12} /> : <Moon size={12} />}
        </button>
        <Clock />
      </div>
    </div>
  );
}
