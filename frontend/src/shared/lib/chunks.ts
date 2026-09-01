import { lazy, type ComponentType } from "react";

export function loadSettingsPanel() {
  return import("@/features/settings/components/settings-panel");
}

export function loadAdminTree() {
  return import("@/app/lazy/admin-tree");
}

export type AdminTreeExport = keyof Awaited<ReturnType<typeof loadAdminTree>>;

export function adminLazy(name: AdminTreeExport) {
  return async () => {
    const mod = await loadAdminTree();
    return { Component: mod[name] as ComponentType };
  };
}

export function lazyAdmin(name: AdminTreeExport) {
  return lazy(() => loadAdminTree().then((mod) => ({ default: mod[name] as ComponentType })));
}

export function loadCallOverlays() {
  return import("@/features/calls/components/call-overlays");
}

export function loadBotBuilderForm() {
  return import("@/features/bots/components/bot-builder-form");
}

export function loadPickerSheet() {
  return import("@/features/composer/components/picker-sheet");
}

export function loadLocationMap() {
  return import("@/features/messages/components/location-map");
}

export function loadGalleryPage() {
  return import("@/app/dev/gallery-page");
}

export function loadAccountsPage() {
  return import("@/app/dev/accounts-page");
}

