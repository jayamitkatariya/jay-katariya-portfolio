import React, { createContext, useContext, useReducer, useCallback } from 'react';

export type AppId = 'finder' | 'terminal';

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  minSize: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  prevPosition?: { x: number; y: number };
  prevSize?: { width: number; height: number };
}

export interface WindowManagerState {
  windows: WindowState[];
  nextZIndex: number;
  activeWindowId: string | null;
}

export type WindowAction =
  | { type: 'OPEN_APP'; appId: AppId; defaultSize: { width: number; height: number }; minSize: { width: number; height: number }; title: string }
  | { type: 'CLOSE_WINDOW'; windowId: string }
  | { type: 'MINIMIZE_WINDOW'; windowId: string }
  | { type: 'MAXIMIZE_WINDOW'; windowId: string }
  | { type: 'RESTORE_WINDOW'; windowId: string }
  | { type: 'FOCUS_WINDOW'; windowId: string }
  | { type: 'MOVE_WINDOW'; windowId: string; position: { x: number; y: number } }
  | { type: 'RESIZE_WINDOW'; windowId: string; size: { width: number; height: number } }
  | { type: 'UNMINIMIZE_WINDOW'; windowId: string }
  | { type: 'DESELECT' };

function getCascadeOffset(index: number): { x: number; y: number } {
  const base = { x: 80, y: 60 };
  return { x: base.x + index * 30, y: base.y + index * 30 };
}

function windowReducer(state: WindowManagerState, action: WindowAction): WindowManagerState {
  switch (action.type) {
    case 'OPEN_APP': {
      const existing = state.windows.find(w => w.appId === action.appId);
      if (existing) {
        if (existing.isMinimized) {
          return windowReducer(state, { type: 'UNMINIMIZE_WINDOW', windowId: existing.id });
        }
        return windowReducer(state, { type: 'FOCUS_WINDOW', windowId: existing.id });
      }
      const offset = getCascadeOffset(state.windows.length);
      const newWindow: WindowState = {
        id: `${action.appId}-${Date.now()}`,
        appId: action.appId,
        title: action.title,
        position: offset,
        size: action.defaultSize,
        minSize: action.minSize,
        isMinimized: false,
        isMaximized: false,
        zIndex: state.nextZIndex,
      };
      return {
        ...state,
        windows: [...state.windows, newWindow],
        nextZIndex: state.nextZIndex + 1,
        activeWindowId: newWindow.id,
      };
    }
    case 'CLOSE_WINDOW': {
      const remaining = state.windows.filter(w => w.id !== action.windowId);
      const visible = remaining.filter(w => !w.isMinimized);
      const topWindow = visible.length > 0
        ? visible.reduce((a, b) => a.zIndex > b.zIndex ? a : b)
        : null;
      return {
        ...state,
        windows: remaining,
        activeWindowId: state.activeWindowId === action.windowId ? (topWindow?.id ?? null) : state.activeWindowId,
      };
    }
    case 'MINIMIZE_WINDOW': {
      const windows = state.windows.map(w =>
        w.id === action.windowId ? { ...w, isMinimized: true } : w
      );
      const visible = windows.filter(w => !w.isMinimized);
      const topWindow = visible.length > 0
        ? visible.reduce((a, b) => a.zIndex > b.zIndex ? a : b)
        : null;
      return {
        ...state,
        windows,
        activeWindowId: state.activeWindowId === action.windowId ? (topWindow?.id ?? null) : state.activeWindowId,
      };
    }
    case 'MAXIMIZE_WINDOW': {
      const win = state.windows.find(w => w.id === action.windowId);
      if (!win) return state;
      if (win.isMaximized) {
        return windowReducer(state, { type: 'RESTORE_WINDOW', windowId: action.windowId });
      }
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.windowId ? {
            ...w,
            isMaximized: true,
            prevPosition: w.position,
            prevSize: w.size,
            position: { x: 0, y: 28 },
            size: { width: window.innerWidth, height: window.innerHeight - 28 - 80 },
            zIndex: state.nextZIndex,
          } : w
        ),
        nextZIndex: state.nextZIndex + 1,
        activeWindowId: action.windowId,
      };
    }
    case 'RESTORE_WINDOW': {
      const win = state.windows.find(w => w.id === action.windowId);
      if (!win) return state;
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.windowId ? {
            ...w,
            isMaximized: false,
            position: w.prevPosition ?? w.position,
            size: w.prevSize ?? w.size,
          } : w
        ),
      };
    }
    case 'FOCUS_WINDOW': {
      const win = state.windows.find(w => w.id === action.windowId);
      if (!win || win.isMinimized) return state;
      if (state.activeWindowId === action.windowId && win.zIndex === state.nextZIndex - 1) return state;
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.windowId ? { ...w, zIndex: state.nextZIndex } : w
        ),
        nextZIndex: state.nextZIndex + 1,
        activeWindowId: action.windowId,
      };
    }
    case 'MOVE_WINDOW': {
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.windowId ? {
            ...w,
            position: action.position,
            isMaximized: false,
          } : w
        ),
      };
    }
    case 'RESIZE_WINDOW': {
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.windowId ? { ...w, size: action.size } : w
        ),
      };
    }
    case 'UNMINIMIZE_WINDOW': {
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.windowId ? { ...w, isMinimized: false, zIndex: state.nextZIndex } : w
        ),
        nextZIndex: state.nextZIndex + 1,
        activeWindowId: action.windowId,
      };
    }
    case 'DESELECT': {
      return { ...state, activeWindowId: null };
    }
    default:
      return state;
  }
}

const initialState: WindowManagerState = {
  windows: [],
  nextZIndex: 10,
  activeWindowId: null,
};

interface WindowManagerContextValue {
  state: WindowManagerState;
  dispatch: React.Dispatch<WindowAction>;
  openApp: (appId: AppId) => void;
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(null);

export function WindowManagerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(windowReducer, initialState);

  const openApp = useCallback((appId: AppId) => {
    // Import from registry dynamically - we pass defaults inline here
    // The actual PortfolioOS will use the registry
    dispatch({ type: 'OPEN_APP', appId, defaultSize: { width: 800, height: 520 }, minSize: { width: 480, height: 320 }, title: appId });
  }, []);

  return (
    <WindowManagerContext.Provider value={{ state, dispatch, openApp }}>
      {children}
    </WindowManagerContext.Provider>
  );
}

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error('useWindowManager must be used within WindowManagerProvider');
  return ctx;
}
