'use client';

import * as React from 'react';

export interface CollapsedContextValue {
  collapsedHeadings: Set<string>;
  toggleHeading: (id: string) => void;
}

export const CollapsedContext = React.createContext<CollapsedContextValue>({
  collapsedHeadings: new Set(),
  toggleHeading: () => {},
});

export function useCollapsedContext() {
  return React.useContext(CollapsedContext);
}

export function CollapsedProvider({ children }: { children: React.ReactNode }) {
  const [collapsedHeadings, setCollapsedHeadings] = React.useState<Set<string>>(new Set());

  const toggleHeading = React.useCallback((id: string) => {
    setCollapsedHeadings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({ collapsedHeadings, toggleHeading }),
    [collapsedHeadings, toggleHeading],
  );

  return <CollapsedContext.Provider value={value}>{children}</CollapsedContext.Provider>;
}
