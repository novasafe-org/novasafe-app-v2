import { create } from "zustand";

interface UIState {
  query: string;
  setQuery: (v: string) => void;
  newOpen: boolean;
  setNewOpen: (v: boolean) => void;
  shareOpen: boolean;
  shareTarget: string | null;
  openShare: (title: string) => void;
  closeShare: () => void;
}

export const useUI = create<UIState>((set) => ({
  query: "",
  setQuery: (v) => set({ query: v }),
  newOpen: false,
  setNewOpen: (v) => set({ newOpen: v }),
  shareOpen: false,
  shareTarget: null,
  openShare: (title) => set({ shareOpen: true, shareTarget: title }),
  closeShare: () => set({ shareOpen: false, shareTarget: null }),
}));
