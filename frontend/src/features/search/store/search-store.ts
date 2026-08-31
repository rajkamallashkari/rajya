import { create } from "zustand";

export type ChatSearchMode = "navigate" | "list";

export interface JumpRestore {
  conversationId: string;
  scrollTop: number;
}

interface SearchState {
  chatOpen: boolean;
  dateOpen: boolean;
  jumpStack: JumpRestore[];
  mode: ChatSearchMode;
  query: string;
  closeChatSearch: () => void;
  handleBack: () => JumpRestore | "closed" | null;
  openChatSearch: () => void;
  popJump: () => JumpRestore | undefined;
  pushJump: (entry: JumpRestore) => void;
  setDateOpen: (open: boolean) => void;
  setMode: (mode: ChatSearchMode) => void;
  setQuery: (query: string) => void;
  toggleMode: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  chatOpen: false,
  dateOpen: false,
  jumpStack: [],
  mode: "navigate",
  query: "",
  closeChatSearch: () => set({ chatOpen: false, query: "", jumpStack: [] }),
  handleBack: () => {
    const jump = get().jumpStack[get().jumpStack.length - 1];
    if (jump) {
      set({ jumpStack: get().jumpStack.slice(0, -1) });
      return jump;
    }
    if (get().chatOpen || get().dateOpen) {
      set({ chatOpen: false, dateOpen: false, query: "" });
      return "closed";
    }
    return null;
  },
  openChatSearch: () => set({ chatOpen: true, dateOpen: false }),
  popJump: () => {
    const next = get().jumpStack[get().jumpStack.length - 1];
    if (!next) {
      return undefined;
    }
    set({ jumpStack: get().jumpStack.slice(0, -1) });
    return next;
  },
  pushJump: (entry) => set((state) => ({ jumpStack: [...state.jumpStack, entry] })),
  setDateOpen: (dateOpen) => set({ dateOpen, chatOpen: dateOpen ? false : get().chatOpen }),
  setMode: (mode) => set({ mode }),
  setQuery: (query) => set({ query }),
  toggleMode: () => set((state) => ({ mode: state.mode === "list" ? "navigate" : "list" })),
}));

export function resetSearchStore(): void {
  useSearchStore.setState({
    chatOpen: false,
    dateOpen: false,
    jumpStack: [],
    mode: "navigate",
    query: "",
  });
}
