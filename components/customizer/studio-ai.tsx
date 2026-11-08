"use client";

import { createContext, useContext } from "react";

// Whether the studio's AI helpers are on. The layout reads the server-side
// flag and hands the boolean down, since the studio page is a client component.
const StudioAiContext = createContext(false);

export function StudioAiProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  return <StudioAiContext.Provider value={enabled}>{children}</StudioAiContext.Provider>;
}

export function useStudioAi() {
  return useContext(StudioAiContext);
}
