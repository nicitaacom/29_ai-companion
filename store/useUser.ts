import { create } from "zustand"

type AccountsStore = {
  setUserId: (userId: string | null) => void
  userId: string | null
}

const useUser = create<AccountsStore>(set => ({
  setUserId: userId => set({ userId }),
  userId: null,
}))

export default useUser
