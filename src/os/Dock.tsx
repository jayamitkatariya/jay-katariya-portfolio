import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Folder, Terminal } from 'lucide-react';
import { useWindowManager, type AppId } from './WindowManager';
import { APP_REGISTRY } from '../data/appRegistry';

const ICON_COMPONENTS: Record<string, typeof Folder> = {
  folder: Folder,
  terminal: Terminal,
};

const BASE_SIZE = 48;
const MAX_SIZE = 72;
const MAGNIFICATION_RANGE = 150;

function getMagnifiedSize(iconCenterX: number, mouseX: number | null): number {
  if (mouseX === null) return BASE_SIZE;
  const distance = Math.abs(iconCenterX - mouseX);
  if (distance > MAGNIFICATION_RANGE) return BASE_SIZE;
  const scale = 0.5 * (1 + Math.cos((Math.PI * distance) / MAGNIFICATION_RANGE));
  return BASE_SIZE + (MAX_SIZE - BASE_SIZE) * scale;
}

export default function Dock() {
  const { state, dispatch } = useWindowManager();
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [bouncingApp, setBouncingApp] = useState<AppId | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const iconCentersRef = useRef<number[]>([]);

  const dockApps = Object.values(APP_REGISTRY).filter(a => a.showInDock);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Cache icon center positions on mouse move instead of during render
    iconRefs.current.forEach((el, i) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        iconCentersRef.current[i] = rect.left + rect.width / 2;
      }
    });
    setMouseX(e.clientX);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouseX(null);
  }, []);

  const handleClick = useCallback((app: typeof dockApps[0]) => {
    const existing = state.windows.find(w => w.appId === app.id);
    if (existing?.isMinimized) {
      dispatch({ type: 'UNMINIMIZE_WINDOW', windowId: existing.id });
    } else if (existing) {
      dispatch({ type: 'FOCUS_WINDOW', windowId: existing.id });
    } else {
      setBouncingApp(app.id);
      setTimeout(() => setBouncingApp(null), 800);
      dispatch({
        type: 'OPEN_APP',
        appId: app.id,
        defaultSize: app.defaultSize,
        minSize: app.minSize,
        title: app.name,
      });
    }
  }, [state.windows, dispatch]);

  return (
    <motion.div
      ref={dockRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 flex items-end gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.12] rounded-2xl shadow-lg"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.2 }}
    >
      {dockApps.map((app, index) => {
        const IconComp = ICON_COMPONENTS[app.icon];
        const isActive = state.windows.some(w => w.appId === app.id && !w.isMinimized);
        const hasWindow = state.windows.some(w => w.appId === app.id);
        const isBouncing = bouncingApp === app.id;

        // Calculate magnified size using cached center positions
        const centerX = iconCentersRef.current[index] ?? 0;
        const size = getMagnifiedSize(centerX, mouseX);

        return (
          <div
            key={app.id}
            className="flex flex-col items-center"
            ref={el => { iconRefs.current[index] = el; }}
          >
            <motion.button
              onClick={() => handleClick(app)}
              animate={isBouncing ? {
                y: [0, -30, 0, -15, 0, -5, 0],
              } : { y: 0 }}
              transition={isBouncing ? {
                duration: 0.8,
                times: [0, 0.2, 0.4, 0.55, 0.7, 0.85, 1],
                ease: 'easeOut',
              } : { duration: 0.1 }}
              className="rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/[0.12] hover:bg-white/20 transition-all group relative shadow-sm"
              style={{
                width: size,
                height: size,
                transition: mouseX !== null ? 'width 0.1s ease, height 0.1s ease' : 'width 0.3s ease, height 0.3s ease',
              }}
              title={app.name}
            >
              <IconComp
                size={size * 0.45}
                className="text-white/90 drop-shadow-sm"
                strokeWidth={1.5}
              />
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-black/50 backdrop-blur-xl border border-white/10 rounded-md text-[10px] font-mono tracking-wider text-white/90 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                {app.name}
              </div>
            </motion.button>
            {/* Active dot */}
            <div
              className={`w-1 h-1 rounded-full mt-1 transition-opacity ${
                hasWindow ? 'opacity-100 bg-white/70' : 'opacity-0'
              }`}
            />
          </div>
        );
      })}
    </motion.div>
  );
}
