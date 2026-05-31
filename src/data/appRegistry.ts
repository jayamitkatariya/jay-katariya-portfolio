import type { AppId } from '../os/WindowManager';

export interface AppRegistryEntry {
  id: AppId;
  name: string;
  icon: 'folder' | 'terminal';
  defaultSize: { width: number; height: number };
  minSize: { width: number; height: number };
  showInDock: boolean;
  showOnDesktop: boolean;
}

export const APP_REGISTRY: Record<AppId, AppRegistryEntry> = {
  finder: {
    id: 'finder',
    name: 'finder',
    icon: 'folder',
    defaultSize: { width: 800, height: 520 },
    minSize: { width: 480, height: 320 },
    showInDock: true,
    showOnDesktop: true,
  },
  terminal: {
    id: 'terminal',
    name: 'terminal',
    icon: 'terminal',
    defaultSize: { width: 640, height: 420 },
    minSize: { width: 400, height: 280 },
    showInDock: true,
    showOnDesktop: true,
  },
};
