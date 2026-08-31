import { create } from "zustand";
import { EMPTY_SEARCH_FILTERS, type SearchFilters } from "@/features/search/model/filters";
import type { components } from "@/shared/lib/api/schema";

export type ChatSearchMode = "navigate" | "list";
export type SearchMember = components["schemas"]["ConversationMember"];

export interface JumpRestore {
  conversationId: string;
  scrollTop: number;
}

interface SearchState {
  chatOpen: boolean;
  dateOpen: boolean;
  filters: SearchFilters;
  filtersOpen: boolean;
  members: SearchMember[];
  jumpStack: JumpRestore[];
  mode: ChatSearchMode;
  query: string;
  closeChatSearch: () => void;
  handleBack: () => JumpRestore | "closed" | null;
  openChatSearch: () => void;
  patchFilters: (patch: SearchFilters) => void;
  popJump: () => JumpRestore | undefined;
  pushJump: (entry: JumpRestore) => void;
  resetFilters: () => void;
  setDateOpen: (open: boolean) => void;
  setFiltersOpen: (open: boolean) => void;
  setMembers: (members: SearchMember[]) => void;
  setMode: (mode: ChatSearchMode) => void;
  setQuery: (query: string) => void;
  toggleMode: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  chatOpen: false,
  dateOpen: false,
  filters: EMPTY_SEARCH_FILTERS,
  filtersOpen: false,
  members: [],
  jumpStack: [],
  mode: "navigate",
  query: "",
  closeChatSearch: () =>
    set({ chatOpen: false, filtersOpen: false, query: "", jumpStack: [], filters: EMPTY_SEARCH_FILTERS }),
  handleBack: () => {
    const jump = get().jumpStack[get().jumpStack.length - 1];
    if (jump) {
      set({ jumpStack: get().jumpStack.slice(0, -1) });
      return jump;
    }
    if (get().chatOpen || get().dateOpen || get().filtersOpen) {
      set({
        chatOpen: false,
        dateOpen: false,
        filtersOpen: false,
        query: "",
        filters: EMPTY_SEARCH_FILTERS,
      });
      return "closed";
    }
    return null;
  },
  openChatSearch: () => set({ chatOpen: true, dateOpen: false }),
  patchFilters: (patch) => set({ filters: { ...get().filters, ...patch } }),
  popJump: () => {
    const next = get().jumpStack[get().jumpStack.length - 1];
    if (!next) {
      return undefined;
    }
    set({ jumpStack: get().jumpStack.slice(0, -1) });
    return next;
  },
  pushJump: (entry) => set((state) => ({ jumpStack: [...state.jumpStack, entry] })),
  resetFilters: () => set({ filters: EMPTY_SEARCH_FILTERS }),
  setDateOpen: (dateOpen) => set({ dateOpen, chatOpen: dateOpen ? false : get().chatOpen }),
  setFiltersOpen: (filtersOpen) => set({ filtersOpen }),
  setMembers: (members) => set({ members }),
  setMode: (mode) => set({ mode }),
  setQuery: (query) => set({ query }),
  toggleMode: () => set((state) => ({ mode: state.mode === "list" ? "navigate" : "list" })),
}));

export function resetSearchStore(): void {
  useSearchStore.setState({
    chatOpen: false,
    dateOpen: false,
    filters: EMPTY_SEARCH_FILTERS,
    filtersOpen: false,
    members: [],
    jumpStack: [],
    mode: "navigate",
    query: "",
  });
}
