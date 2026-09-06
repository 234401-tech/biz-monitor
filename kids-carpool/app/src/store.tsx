import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { DayPlan } from './data'
import { initialWeek, tripStops } from './data'

export type Tab = 'home' | 'schedule' | 'tracking' | 'group' | 'my'

type Store = {
  tab: Tab
  setTab: (t: Tab) => void
  profileId: string | null
  openProfile: (id: string | null) => void
  onboarded: boolean
  finishOnboarding: () => void
  week: DayPlan[]
  acceptSwap: () => void
  tripDone: number // 완료된 정류장 수 (0 ~ tripStops.length)
  toast: (msg: string) => void
  toastMsg: string | null
}

const Ctx = createContext<Store | null>(null)

const ONBOARD_KEY = 'gachitayo.onboarded'

function readOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARD_KEY) === '1'
  } catch {
    return false
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>('home')
  const [profileId, openProfile] = useState<string | null>(null)
  const [onboarded, setOnboarded] = useState(readOnboarded)
  const [week, setWeek] = useState(initialWeek)
  const [tripDone, setTripDone] = useState(2)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  // 데모용 운행 시뮬레이션: 10초마다 다음 정류장 완료
  useEffect(() => {
    if (tripDone >= tripStops.length) return
    const t = window.setTimeout(() => setTripDone((n) => n + 1), 10000)
    return () => window.clearTimeout(t)
  }, [tripDone])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2400)
  }

  const store = useMemo<Store>(() => ({
    tab,
    setTab,
    profileId,
    openProfile,
    onboarded,
    finishOnboarding: () => {
      setOnboarded(true)
      try { localStorage.setItem(ONBOARD_KEY, '1') } catch { /* 사생활 보호 모드 등 */ }
    },
    week,
    acceptSwap: () => {
      setWeek((w) => {
        const wed = w.find((d) => d.day === '수')
        const thu = w.find((d) => d.day === '목')
        if (!wed?.swap || !thu) return w
        return w.map((d) => {
          if (d.day === '수') return { ...d, driverId: thu.driverId, mine: true, swap: undefined }
          if (d.day === '목') return { ...d, driverId: wed.driverId, mine: false }
          return d
        })
      })
      showToast('수요일 당번을 맡기로 했어요')
    },
    tripDone,
    toastMsg,
    toast: showToast,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [tab, profileId, onboarded, week, tripDone, toastMsg])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider missing')
  return s
}
