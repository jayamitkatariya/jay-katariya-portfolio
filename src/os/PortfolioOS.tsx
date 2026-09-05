import React, { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { WindowManagerProvider, useWindowManager } from './WindowManager';
import { APP_REGISTRY } from '../data/appRegistry';
import MenuBar from './MenuBar';
import Dock from './Dock';
import Window from './Window';
import DesktopIcon from './DesktopIcon';
import FinderApp from '../apps/FinderApp';
import TerminalApp from '../apps/TerminalApp';

const APP_COMPONENTS: Record<string, React.ComponentType> = {
  finder: FinderApp,
  terminal: TerminalApp,
};

interface PortfolioOSProps {
  isDark: boolean;
  onToggleDark: () => void;
}

function DesktopContent({ isDark, onToggleDark }: PortfolioOSProps) {
  const { state, dispatch } = useWindowManager();

  // Open Finder by default on mount
  useEffect(() => {
    const finder = APP_REGISTRY.finder;
    dispatch({
      type: 'OPEN_APP',
      appId: 'finder',
      defaultSize: finder.defaultSize,
      minSize: finder.minSize,
      title: finder.name,
    });
  }, []);

  const handleDesktopClick = (e: React.MouseEvent) => {
    // Only deselect if clicking the desktop background itself
    if ((e.target as HTMLElement).dataset.desktop) {
      dispatch({ type: 'DESELECT' });
    }
  };

  return (
    <div
      className="h-[calc(100vh-48px)] sm:h-[calc(100vh-52px)] md:h-[calc(100vh-56px)] w-full relative overflow-hidden select-none mt-12 sm:mt-[52px] md:mt-14"
    >
      {/* Wallpaper - same gradient as AI chatbot */}
      <div
        className="absolute inset-0 z-0"
        data-desktop="true"
        onClick={handleDesktopClick}
      >
        {/* Primary gradient layer */}
        <div
          className="absolute inset-0 animate-gradient-xy"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 20%, #0f1930 40%, #2d1b69 60%, #1a0a2e 80%, #0a1520 100%)'
              : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
            backgroundSize: '400% 400%',
          }}
        />
        {/* Secondary counter-rotating gradient layer */}
        <div
          className="absolute inset-0 animate-gradient-xy opacity-60"
          style={{
            background: isDark
              ? 'linear-gradient(225deg, #0f1930 0%, #2d1b69 30%, #4facfe22 50%, #f093fb22 70%, #0a0a1a 100%)'
              : 'linear-gradient(225deg, #f5576c 0%, #f093fb 30%, #4facfe 60%, #00f2fe 100%)',
            backgroundSize: '300% 300%',
            animationDirection: 'reverse',
            animationDuration: '4s',
          }}
        />
        {/* Subtle noise overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Menu Bar */}
      <MenuBar isDark={isDark} onToggleDark={onToggleDark} />

      {/* Desktop Icons */}
      <div
        className="absolute top-10 right-4 z-[5] flex flex-col gap-2"
        data-desktop="true"
        onClick={handleDesktopClick}
      >
        {Object.values(APP_REGISTRY)
          .filter(a => a.showOnDesktop)
          .map(app => (
            <DesktopIcon key={app.id} appId={app.id} />
          ))
        }
      </div>

      {/* Windows */}
      <AnimatePresence>
        {state.windows
          .filter(w => !w.isMinimized)
          .map(win => {
            const AppComponent = APP_COMPONENTS[win.appId];
            return (
              <Window key={win.id} windowState={win}>
                <AppComponent />
              </Window>
            );
          })
        }
      </AnimatePresence>

      {/* Dock */}
      <Dock />
    </div>
  );
}

export default function PortfolioOS(props: PortfolioOSProps) {
  return (
    <WindowManagerProvider>
      <DesktopContent {...props} />
    </WindowManagerProvider>
  );
}
