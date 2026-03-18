import { create } from "zustand"

export type AuthModalVariant = "login" | "register"

type AccountModalStore = {
  isOpen: boolean
  variant: AuthModalVariant
  openModal: (variant?: AuthModalVariant) => void
  closeModal: () => void
}

export const useAccountModal = create<AccountModalStore>(set => ({
  isOpen: false,
  variant: "login",
  openModal: (variant = "login") => set({ isOpen: true, variant }),
  closeModal: () => set({ isOpen: false }),
}))
