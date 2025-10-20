import { create } from "zustand";

export const useChatMessageStore = create<FormState & Actions>((set, get) => ({
  ...initial,

  set: <K extends keyof FormState>(k: K, v: FormState[K]) =>
    set((s) => ({ ...s, [k]: v })),

  addImage: (img) => set((s) => ({ images: [...s.images, img] })),

  removeImage: (idx) =>
    set((s) => ({ images: s.images.filter((_, i) => i !== idx) })),

  reset: () => set(() => ({ ...initial })),
}));
