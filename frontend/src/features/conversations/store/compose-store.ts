import { create } from "zustand";

interface ComposeState {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

export const useComposeStore = create<ComposeState>((set) => ({
  menuOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
}));

export function resetComposeStore(): void {
  useComposeStore.setState({ menuOpen: false });
}
