import { create } from "zustand";
import type { SettingsPanelId } from "@/features/settings/model/constants";

export interface ShellState {
  impersonatingName: string | null;
  setImpersonatingName: (name: string | null) => void;
  setSettingsPanel: (panel: SettingsPanelId) => void;
  settingsPanel: SettingsPanelId;
}

const INITIAL_SHELL: Pick<ShellState, "impersonatingName" | "settingsPanel"> = {
  impersonatingName: null,
  settingsPanel: "hub",
};

export const useShellStore = create<ShellState>((set) => ({
  ...INITIAL_SHELL,
  setImpersonatingName: (impersonatingName) => set({ impersonatingName }),
  setSettingsPanel: (settingsPanel) => set({ settingsPanel }),
}));

export function resetShellStore(): void {
  useShellStore.setState({ ...INITIAL_SHELL });
}
