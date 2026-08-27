import { create } from "zustand";

const useDemoStore = create(() => ({ open: false }));

export function readAll() {
  return useDemoStore();
}
