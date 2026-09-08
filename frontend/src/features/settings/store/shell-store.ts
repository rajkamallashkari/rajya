import { create } from "zustand";
import type { SettingsPanelId } from "@/features/settings/model/constants";
import {
  DEFAULT_SHELL_DESTINATION,
  type ShellDestination,
} from "@/shared/lib/navigation/destinations";

export interface ShellState {
  destination: ShellDestination;
  impersonatingName: string | null;
  profileSettingsOpen: boolean;
  setDestination: (destination: ShellDestination) => void;
  setImpersonatingName: (name: string | null) => void;
  setProfileSettingsOpen: (open: boolean) => void;
  setSettingsPanel: (panel: SettingsPanelId) => void;
  settingsPanel: SettingsPanelId;
}

const INITIAL_SHELL: Pick<
  ShellState,
  "destination" | "impersonatingName" | "profileSettingsOpen" | "settingsPanel"
> = {
  destination: DEFAULT_SHELL_DESTINATION,
  impersonatingName: null,
  profileSettingsOpen: false,
  settingsPanel: "hub",
};

export const useShellStore = create<ShellState>((set) => ({
  ...INITIAL_SHELL,
  setDestination: (destination) => set({ destination, profileSettingsOpen: false }),
  setImpersonatingName: (impersonatingName) => set({ impersonatingName }),
  setProfileSettingsOpen: (profileSettingsOpen) => set({ profileSettingsOpen }),
  setSettingsPanel: (settingsPanel) => set({ settingsPanel }),
}));

export function resetShellStore(): void {
  useShellStore.setState({ ...INITIAL_SHELL });
}
