import { create } from "zustand"

type AccountModalStore = {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

export const useAccountModal = create<AccountModalStore>((set, get) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}))
