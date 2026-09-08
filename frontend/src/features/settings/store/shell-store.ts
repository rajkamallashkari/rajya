import { create } from "zustand";
import type { SettingsPanelId } from "@/features/settings/model/constants";
import {
  DEFAULT_SHELL_DESTINATION,
  type ShellDestination,
} from "@/shared/lib/navigation/destinations";

export interface ShellState {
  destination: ShellDestination;
  impersonatingName: string | null;
  setDestination: (destination: ShellDestination) => void;
  setImpersonatingName: (name: string | null) => void;
  setSettingsPanel: (panel: SettingsPanelId) => void;
  settingsPanel: SettingsPanelId;
}

const INITIAL_SHELL: Pick<ShellState, "destination" | "impersonatingName" | "settingsPanel"> = {
  destination: DEFAULT_SHELL_DESTINATION,
  impersonatingName: null,
  settingsPanel: "hub",
};

export const useShellStore = create<ShellState>((set) => ({
  ...INITIAL_SHELL,
  setDestination: (destination) => set({ destination }),
  setImpersonatingName: (impersonatingName) => set({ impersonatingName }),
  setSettingsPanel: (settingsPanel) => set({ settingsPanel }),
}));

export function resetShellStore(): void {
  useShellStore.setState({ ...INITIAL_SHELL });
}
