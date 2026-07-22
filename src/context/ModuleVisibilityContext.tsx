'use client';

import React from 'react';
import { fetchModuleVisibilityMap } from '@/features/modulos/client';
import { PROTECTED_MODULE_KEYS, moduleKeysForPath } from '@/features/modulos/catalog';

interface ModuleVisibilityContextType {
  /** Solo excepciones: lo que no aparece está encendido. */
  map: Record<string, boolean>;
  isLoaded: boolean;
  isModuleEnabled: (key: string) => boolean;
  /** true si la ruta pertenece a un módulo o submódulo apagado. */
  isPathDisabled: (pathname: string) => boolean;
  refresh: () => Promise<void>;
}

const ModuleVisibilityContext = React.createContext<ModuleVisibilityContextType>({
  map: {},
  isLoaded: false,
  isModuleEnabled: () => true,
  isPathDisabled: () => false,
  refresh: async () => {},
});

export function ModuleVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = React.useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try {
      setMap(await fetchModuleVisibilityMap());
    } catch {
      // Ante un fallo se asume todo encendido: nunca dejamos al usuario sin menú.
      setMap({});
    } finally {
      setIsLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = React.useMemo<ModuleVisibilityContextType>(() => {
    const isModuleEnabled = (key: string) =>
      PROTECTED_MODULE_KEYS.has(key) ? true : map[key] !== false;
    return {
      map,
      isLoaded,
      isModuleEnabled,
      isPathDisabled: (pathname: string) =>
        moduleKeysForPath(pathname).some((key) => !isModuleEnabled(key)),
      refresh,
    };
  }, [map, isLoaded, refresh]);

  return (
    <ModuleVisibilityContext.Provider value={value}>{children}</ModuleVisibilityContext.Provider>
  );
}

export function useModuleVisibility(): ModuleVisibilityContextType {
  return React.useContext(ModuleVisibilityContext);
}
