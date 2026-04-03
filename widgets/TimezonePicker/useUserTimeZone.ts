import { create } from "zustand"

type UserTimezoneStore = {
  setUserTimezone: (userTimezone: string) => void
  userTimezone: string
}

const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"

const useUserTimezone = create<UserTimezoneStore>(set => ({
  setUserTimezone: userTimezone => set({ userTimezone }),
  userTimezone: defaultTimezone,
}))

export default useUserTimezone
