import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const KEY = 'moom-sb-collapsed';

interface Ctx {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
}

const SidebarCollapseCtx = createContext<Ctx>({
  collapsed: false,
  toggle: () => {},
  setCollapsed: () => {},
});

export const SidebarCollapseProvider = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(KEY) === '1';
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, collapsed ? '1' : '0');
    } catch {}
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsedState(c => !c), []);
  const setCollapsed = useCallback((v: boolean) => setCollapsedState(v), []);

  return (
    <SidebarCollapseCtx.Provider value={{ collapsed, toggle, setCollapsed }}>
      {children}
    </SidebarCollapseCtx.Provider>
  );
};

export const useSidebarCollapse = () => useContext(SidebarCollapseCtx);
