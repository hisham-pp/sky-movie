import { createContext, useContext, type ReactNode } from 'react';
import { useLibraryController } from './useLibraryController';

type LibraryController = ReturnType<typeof useLibraryController>;

const LibraryControllerContext = createContext<LibraryController | null>(null);

export function LibraryControllerProvider({ children }: { children: ReactNode }) {
  const library = useLibraryController();
  return (
    <LibraryControllerContext.Provider value={library}>
      {children}
    </LibraryControllerContext.Provider>
  );
}

export function useLibraryControllerContext(): LibraryController {
  const ctx = useContext(LibraryControllerContext);
  if (!ctx) throw new Error('useLibraryControllerContext must be used inside LibraryControllerProvider');
  return ctx;
}
