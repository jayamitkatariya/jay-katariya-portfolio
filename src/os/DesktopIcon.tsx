import React, { useCallback, useRef } from 'react';
import { Folder, Terminal } from 'lucide-react';
import { useWindowManager, type AppId } from './WindowManager';
import { APP_REGISTRY } from '../data/appRegistry';

const ICON_COMPONENTS: Record<string, typeof Folder> = {
  folder: Folder,
  terminal: Terminal,
};

interface DesktopIconProps {
  key?: React.Key;
  appId: AppId;
}

export default function DesktopIcon({ appId }: DesktopIconProps) {
  const { dispatch } = useWindowManager();
  const app = APP_REGISTRY[appId];
  const IconComp = ICON_COMPONENTS[app.icon];
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCount = useRef(0);

  const handleClick = useCallback(() => {
    clickCount.current += 1;
    if (clickCount.current === 1) {
      clickTimer.current = setTimeout(() => {
        clickCount.current = 0;
      }, 300);
    } else if (clickCount.current === 2) {
      if (clickTimer.current) clearTimeout(clickTimer.current);
      clickCount.current = 0;
      dispatch({
        type: 'OPEN_APP',
        appId: app.id,
        defaultSize: app.defaultSize,
        minSize: app.minSize,
        title: app.name,
      });
    }
  }, [dispatch, app]);

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-white/10 transition-colors group cursor-default w-20"
    >
      <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/[0.12] flex items-center justify-center group-hover:scale-105 group-hover:bg-white/15 transition-all shadow-sm">
        <IconComp size={28} className="text-white/90 drop-shadow-sm" strokeWidth={1.5} />
      </div>
      <span className="font-mono text-[10px] tracking-wider text-white/90 text-center leading-tight drop-shadow-md">
        {app.name}
      </span>
    </button>
  );
}
