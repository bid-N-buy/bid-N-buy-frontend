import { create } from "zustand";

interface ToastState {
  isVisible: boolean;
  message: string;
  type: "success" | "error";

  showToast: (message: string, type: "success" | "error") => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  isVisible: false,
  message: "",
  type: "success",

  showToast: (message, type = "success") =>
    set({
      isVisible: true,
      message,
      type,
    }),

  hideToast: () => set({ isVisible: false, message: "" }),
}));
