import { create } from "zustand";

export interface ShellState {
  impersonatingName: string | null;
  setImpersonatingName: (name: string | null) => void;
}

export const useShellStore = create<ShellState>((set) => ({
  impersonatingName: null,
  setImpersonatingName: (impersonatingName) => set({ impersonatingName }),
}));
