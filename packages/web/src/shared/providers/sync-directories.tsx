'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type SyncDirectoriesContextValue = {
  /** Directories explicitly set by the user (can be empty) */
  directories: string[];
  /** Directories used for API calls, falling back to defaults when empty */
  effectiveDirectories: string[];
  addDirectory: (dir: string) => void;
  removeDirectory: (dir: string) => void;
  setDirectories: (dirs: string[]) => void;
  resetToDefault: () => void;
};

const DEFAULT_DIRECTORIES = ['zettelkasten'];
const STORAGE_KEY = 'dms:syncDirectories';

const SyncDirectoriesContext = createContext<SyncDirectoriesContextValue | undefined>(undefined);

export function SyncDirectoriesProvider({ children }: { children: ReactNode }) {
  const [directories, setDirectoriesState] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.filter(
            (dir): dir is string => typeof dir === 'string' && dir.trim() !== '',
          );
          setDirectoriesState(sanitized);
        }
      }
    } catch {
      // Ignore parse errors and fall back to defaults
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(directories));
  }, [directories]);

  const addDirectory = useCallback((dir: string) => {
    const value = dir.trim();
    if (!value) return;
    setDirectoriesState((prev) => {
      if (prev.includes(value)) return prev;
      return [...prev, value];
    });
  }, []);

  const removeDirectory = useCallback((dir: string) => {
    setDirectoriesState((prev) => prev.filter((d) => d !== dir));
  }, []);

  const setDirectories = useCallback((dirs: string[]) => {
    setDirectoriesState(
      dirs
        .map((dir) => dir.trim())
        .filter((dir) => dir.length > 0)
        .filter((dir, index, arr) => arr.indexOf(dir) === index),
    );
  }, []);

  const resetToDefault = useCallback(() => {
    setDirectoriesState([]);
  }, []);

  const value = useMemo<SyncDirectoriesContextValue>(() => {
    const effectiveDirectories = directories.length > 0 ? directories : [...DEFAULT_DIRECTORIES];

    return {
      directories,
      effectiveDirectories,
      addDirectory,
      removeDirectory,
      setDirectories,
      resetToDefault,
    };
  }, [addDirectory, directories, removeDirectory, resetToDefault, setDirectories]);

  return (
    <SyncDirectoriesContext.Provider value={value}>{children}</SyncDirectoriesContext.Provider>
  );
}

export function useSyncDirectories(): SyncDirectoriesContextValue {
  const context = useContext(SyncDirectoriesContext);
  if (!context) {
    throw new Error('useSyncDirectories must be used within a SyncDirectoriesProvider');
  }
  return context;
}
