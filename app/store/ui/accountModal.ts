import { create } from "zustand"

import { TAuthModalVariant } from "./types/TAuthModalVariant"

type AccountModalStore = {
  isOpen: boolean
  variant: TAuthModalVariant
  openModal: (variant?: TAuthModalVariant) => void
  closeModal: () => void
}

export const useAccountModal = create<AccountModalStore>(set => ({
  isOpen: false,
  variant: "login",
  openModal: (variant = "login") => set({ isOpen: true, variant }),
  closeModal: () => set({ isOpen: false }),
}))
