import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useWindowManager, type WindowState } from './WindowManager';
import { APP_REGISTRY } from '../data/appRegistry';

interface WindowProps {
  key?: React.Key;
  windowState: WindowState;
  children: React.ReactNode;
}

const MENUBAR_HEIGHT = 28;

export default function Window({ windowState, children }: WindowProps) {
  const { state, dispatch } = useWindowManager();
  const appInfo = APP_REGISTRY[windowState.appId];
  const isActive = state.activeWindowId === windowState.id;
  const [trafficHover, setTrafficHover] = useState(false);
  const posRef = useRef(windowState.position);
  posRef.current = windowState.position;

  // Track active pointer listeners for cleanup on unmount
  const cleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  const handlePointerDown = useCallback(() => {
    if (!isActive) {
      dispatch({ type: 'FOCUS_WINDOW', windowId: windowState.id });
    }
  }, [dispatch, windowState.id, isActive]);

  // Title bar drag — uses refs to avoid stale closures
  const handleTitleBarPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-traffic-light]')) return;
    e.preventDefault();
    dispatch({ type: 'FOCUS_WINDOW', windowId: windowState.id });

    const startX = e.clientX - posRef.current.x;
    const startY = e.clientY - posRef.current.y;
    const winWidth = windowState.size.width;

    const handleMove = (e: PointerEvent) => {
      let newX = e.clientX - startX;
      let newY = e.clientY - startY;
      newX = Math.max(-winWidth + 100, Math.min(newX, window.innerWidth - 100));
      newY = Math.max(MENUBAR_HEIGHT, Math.min(newY, window.innerHeight - 36));
      dispatch({ type: 'MOVE_WINDOW', windowId: windowState.id, position: { x: newX, y: newY } });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      cleanupRef.current = null;
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    cleanupRef.current = handleUp;
  }, [dispatch, windowState.id, windowState.size.width]);

  // Resize handles
  const handleResizePointerDown = useCallback((edge: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: 'FOCUS_WINDOW', windowId: windowState.id });

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = windowState.size.width;
    const startH = windowState.size.height;
    const startPosX = windowState.position.x;
    const startPosY = windowState.position.y;

    const handleMove = (e: PointerEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newW = startW, newH = startH, newX = startPosX, newY = startPosY;

      if (edge.includes('right')) newW = Math.max(appInfo.minSize.width, startW + dx);
      if (edge.includes('bottom')) newH = Math.max(appInfo.minSize.height, startH + dy);
      if (edge.includes('left')) {
        newW = Math.max(appInfo.minSize.width, startW - dx);
        newX = startPosX + (startW - newW);
      }
      if (edge.includes('top')) {
        newH = Math.max(appInfo.minSize.height, startH - dy);
        newY = startPosY + (startH - newH);
      }

      dispatch({ type: 'RESIZE_WINDOW', windowId: windowState.id, size: { width: newW, height: newH } });
      if (edge.includes('left') || edge.includes('top')) {
        dispatch({ type: 'MOVE_WINDOW', windowId: windowState.id, position: { x: newX, y: newY } });
      }
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      cleanupRef.current = null;
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    cleanupRef.current = handleUp;
  }, [dispatch, windowState, appInfo.minSize]);

  const handleTitleBarDoubleClick = useCallback(() => {
    dispatch({ type: 'MAXIMIZE_WINDOW', windowId: windowState.id });
  }, [dispatch, windowState.id]);

  if (windowState.isMinimized) return null;

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        opacity: { duration: 0.2 },
      }}
      onPointerDown={handlePointerDown}
      style={{
        position: 'absolute',
        zIndex: windowState.zIndex,
        left: windowState.position.x,
        top: windowState.position.y,
        width: windowState.size.width,
        height: windowState.size.height,
      }}
      className="flex flex-col rounded-xl overflow-hidden border border-[var(--border-primary)]"
      data-window-id={windowState.id}
    >
      {/* Window shadow */}
      <div className="absolute inset-0 rounded-xl pointer-events-none" style={{
        boxShadow: isActive
          ? '0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)'
          : '0 10px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.2s ease',
      }} />

      {/* Title Bar */}
      <div
        className={`h-9 flex items-center px-3 select-none shrink-0 ${
          isActive ? 'bg-[var(--bg-secondary)]' : 'bg-[var(--bg-secondary)]/80'
        } border-b border-[var(--border-secondary)]`}
        onPointerDown={handleTitleBarPointerDown}
        onDoubleClick={handleTitleBarDoubleClick}
        style={{ cursor: 'default' }}
      >
        {/* Traffic lights */}
        <div
          className="flex items-center gap-2 mr-3"
          data-traffic-light
          onMouseEnter={() => setTrafficHover(true)}
          onMouseLeave={() => setTrafficHover(false)}
        >
          <button
            onClick={() => dispatch({ type: 'CLOSE_WINDOW', windowId: windowState.id })}
            className="w-3 h-3 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: isActive ? '#FF5F57' : 'var(--text-muted)' }}
          >
            {trafficHover && isActive && (
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                <path d="M0.5 0.5L5.5 5.5M5.5 0.5L0.5 5.5" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" />
              </svg>
            )}
          </button>
          <button
            onClick={() => dispatch({ type: 'MINIMIZE_WINDOW', windowId: windowState.id })}
            className="w-3 h-3 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: isActive ? '#FEBC2E' : 'var(--text-muted)' }}
          >
            {trafficHover && isActive && (
              <svg width="6" height="2" viewBox="0 0 6 2" fill="none">
                <path d="M0.5 1H5.5" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" />
              </svg>
            )}
          </button>
          <button
            onClick={() => dispatch({ type: 'MAXIMIZE_WINDOW', windowId: windowState.id })}
            className="w-3 h-3 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: isActive ? '#28C840' : 'var(--text-muted)' }}
          >
            {trafficHover && isActive && (
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                <path d="M1 1L5 1L5 5L1 5Z" stroke="rgba(0,0,0,0.5)" strokeWidth="1" fill="none" />
              </svg>
            )}
          </button>
        </div>

        {/* Title */}
        <div className="flex-1 text-center">
          <span className="font-mono text-[11px] tracking-widest text-[var(--text-secondary)]">
            {windowState.title}
          </span>
        </div>

        {/* Spacer to balance traffic lights */}
        <div className="w-12" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-[var(--bg-primary)]">
        {children}
      </div>

      {/* Resize handles */}
      {!windowState.isMaximized && (
        <>
          <div className="absolute z-50 cursor-n-resize top-0 left-2 right-2 h-1" onPointerDown={handleResizePointerDown('top')} />
          <div className="absolute z-50 cursor-s-resize bottom-0 left-2 right-2 h-1" onPointerDown={handleResizePointerDown('bottom')} />
          <div className="absolute z-50 cursor-w-resize top-2 bottom-2 left-0 w-1" onPointerDown={handleResizePointerDown('left')} />
          <div className="absolute z-50 cursor-e-resize top-2 bottom-2 right-0 w-1" onPointerDown={handleResizePointerDown('right')} />
          <div className="absolute z-50 cursor-nw-resize top-0 left-0 w-3 h-3" onPointerDown={handleResizePointerDown('top-left')} />
          <div className="absolute z-50 cursor-ne-resize top-0 right-0 w-3 h-3" onPointerDown={handleResizePointerDown('top-right')} />
          <div className="absolute z-50 cursor-sw-resize bottom-0 left-0 w-3 h-3" onPointerDown={handleResizePointerDown('bottom-left')} />
          <div className="absolute z-50 cursor-se-resize bottom-0 right-0 w-3 h-3" onPointerDown={handleResizePointerDown('bottom-right')} />
        </>
      )}
    </motion.div>
  );
}
