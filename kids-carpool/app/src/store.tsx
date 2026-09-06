import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { DayPlan, Parent } from './data'
import { initialWeek, parents as demoParents, tripStops as demoTripStops } from './data'
import { LIVE, api, getToken, setToken, openSocket } from './api'
import type { Member, Plan, Swap, Trip, TripEvent, WsMessage } from './api'

export type Tab = 'home' | 'schedule' | 'tracking' | 'group' | 'my'
export type Mode = 'demo' | 'live'
export type Stop = { label: string; time: string }
export type TrackPoint = { lat: number; lng: number }
export type RegisterForm = {
  inviteCode: string
  phone: string
  password: string
  name: string
  label: string
  children: string
  vehicle: string
  apt: string
}

type Store = {
  mode: Mode
  tab: Tab
  setTab: (t: Tab) => void
  profileId: string | null
  openProfile: (id: string | null) => void
  onboarded: boolean
  finishOnboarding: () => void
  loggedIn: boolean
  loading: boolean
  me: Parent
  parents: Record<string, Parent>
  groupName: string
  school: string
  week: DayPlan[]
  acceptSwap: (swapId: string) => void
  requestSwap: (fromDow: number, toDow: number, reason: string) => void
  stops: Stop[]
  tripDone: number // 완료된 정류장 수 (0 ~ stops.length)
  tripActive: boolean
  isDriver: boolean // 오늘 당번이 나인지
  startTrip: (kind: '등원' | '하원') => void
  markNextStop: () => void
  endTrip: () => void
  track: TrackPoint[] // 운행 중 수신한 위치 궤적 (라이브 전용, 메모리에만 유지)
  auth: {
    login: (phone: string, password: string) => Promise<void>
    register: (form: RegisterForm) => Promise<void>
    logout: () => void
  }
  toast: (msg: string) => void
  toastMsg: string | null
}

const Ctx = createContext<Store | null>(null)

const ONBOARD_KEY = 'gachitayo.onboarded'
const DOW_DAY = ['월', '화', '수', '목', '금']
const PALETTE = [
  { bg: 'var(--green-tint)', fg: 'var(--green)' },
  { bg: 'var(--yellow-tint)', fg: 'var(--amber)' },
  { bg: '#E8E3F4', fg: '#6B5CA8' },
]

function readOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARD_KEY) === '1'
  } catch {
    return false
  }
}

// 1=월 … 5=금, 주말은 6/7 (오늘 당번인 날 없음)
function todayDow(): number {
  const d = new Date().getDay()
  return d === 0 ? 7 : d
}

function memberToParent(m: Member, index: number): Parent {
  const pal = PALETTE[index % PALETTE.length]
  return {
    id: String(m.id),
    name: m.name,
    label: m.label,
    initial: m.label.charAt(0) || '?',
    bg: pal.bg,
    fg: pal.fg,
    apt: m.apt,
    vehicle: m.vehicle || undefined,
    children: m.children || undefined,
    verified: m.verified,
  }
}

function formatDate(weekStart: string, dow: number): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + (dow - 1))
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

function toPlans(weekStart: string, plans: Plan[], swaps: Swap[], myId: string, today: number): DayPlan[] {
  return plans.map((p) => {
    const swap = swaps.find((s) => s.from_dow === p.dow)
    const to = swap ? plans.find((q) => q.dow === swap.to_dow) : undefined
    return {
      day: DOW_DAY[p.dow - 1] ?? String(p.dow),
      date: formatDate(weekStart, p.dow),
      driverId: String(p.driver_id),
      riders: p.riders,
      today: p.dow === today,
      mine: String(p.driver_id) === myId,
      note: p.note || undefined,
      swap: swap
        ? {
            id: String(swap.id),
            reason: swap.reason,
            proposal: `${DOW_DAY[swap.to_dow - 1] ?? swap.to_dow}요일 당번과 맞바꾸기를 제안했어요`,
            canAccept: to?.driver_id !== undefined && String(to.driver_id) === myId,
          }
        : undefined,
    }
  })
}

// 오늘 당번의 정류장 목록: 아이들 탑승 순서 + 학교 도착. 완료된 만큼 실제 기록 시각을 붙인다.
function toStops(riders: string[], school: string, events: TripEvent[]): Stop[] {
  const labels = [...riders.map((r) => `${r} 탑승 완료`), `${school} 도착 · 하차 완료`]
  return labels.map((label, i) => {
    const ev = events[i]
    return { label, time: ev ? new Date(ev.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '' }
  })
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>('home')
  const [profileId, openProfile] = useState<string | null>(null)
  const [onboarded, setOnboarded] = useState(readOnboarded)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2400)
  }

  // ---- 데모 모드 상태 ----
  const [demoWeek, setDemoWeek] = useState(initialWeek)
  const [demoTripDone, setDemoTripDone] = useState(2)

  useEffect(() => {
    if (LIVE) return
    if (demoTripDone >= demoTripStops.length) return
    const t = window.setTimeout(() => setDemoTripDone((n) => n + 1), 10000)
    return () => window.clearTimeout(t)
  }, [demoTripDone])

  // ---- 라이브 모드 상태 ----
  const [loggedIn, setLoggedIn] = useState(() => LIVE && !!getToken())
  const [loading, setLoading] = useState(LIVE)
  const [liveMe, setLiveMe] = useState<Member | null>(null)
  const [liveGroup, setLiveGroup] = useState<{ name: string; school: string } | null>(null)
  const [liveMembers, setLiveMembers] = useState<Member[]>([])
  const [liveWeekStart, setLiveWeekStart] = useState('')
  const [livePlans, setLivePlans] = useState<Plan[]>([])
  const [liveSwaps, setLiveSwaps] = useState<Swap[]>([])
  const [liveTrip, setLiveTrip] = useState<Trip | null>(null)
  const [liveEvents, setLiveEvents] = useState<TripEvent[]>([])
  const [track, setTrack] = useState<TrackPoint[]>([])
  const socketSend = useRef<((m: unknown) => void) | null>(null)

  const handleError = (e: unknown, fallback: string) => {
    if (!getToken()) {
      setLoggedIn(false)
      return
    }
    showToast(e instanceof Error ? e.message : fallback)
  }

  const refetchWeek = async () => {
    try {
      const w = await api.week()
      setLiveWeekStart(w.weekStart)
      setLivePlans(w.plans)
      setLiveSwaps(w.swaps)
    } catch (e) {
      handleError(e, '당번표를 불러오지 못했어요')
    }
  }

  const refetchTrip = async () => {
    try {
      const t = await api.activeTrip()
      setLiveTrip(t.trip)
      setLiveEvents(t.events)
      if (!t.trip) setTrack([])
    } catch (e) {
      handleError(e, '운행 정보를 불러오지 못했어요')
    }
  }

  // 로그인 상태가 되면 초기 데이터를 불러온다
  useEffect(() => {
    if (!LIVE || !loggedIn) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const [me, group, week, trip] = await Promise.all([api.me(), api.group(), api.week(), api.activeTrip()])
        if (cancelled) return
        setLiveMe(me)
        setLiveGroup(group.group)
        setLiveMembers(group.members)
        setLiveWeekStart(week.weekStart)
        setLivePlans(week.plans)
        setLiveSwaps(week.swaps)
        setLiveTrip(trip.trip)
        setLiveEvents(trip.events)
      } catch (e) {
        handleError(e, '정보를 불러오지 못했어요')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn])

  // 실시간 갱신 소켓: 끊기면 3초 후 자동 재접속
  useEffect(() => {
    if (!LIVE || !loggedIn) return
    const onMessage = (m: WsMessage) => {
      if (m.type === 'week') refetchWeek()
      else if (m.type === 'trip') refetchTrip()
      else if (m.type === 'loc') setTrack((t) => [...t, { lat: m.lat, lng: m.lng }])
    }
    const close = openSocket(onMessage, socketSend)
    return close
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn])

  const myId = liveMe ? String(liveMe.id) : ''
  const isDriver = LIVE ? livePlans.find((p) => p.dow === todayDow())?.driver_id === liveMe?.id : false
  const tripActive = LIVE ? !!liveTrip : true

  // 운전자 기기: 운행 중일 때만 위치를 관찰해 소켓으로 전송
  useEffect(() => {
    if (!LIVE || !isDriver || !liveTrip) return
    if (!('geolocation' in navigator)) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => socketSend.current?.({ type: 'loc', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => showToast('위치 권한이 없어서 위치를 공유할 수 없어요'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDriver, liveTrip?.id])

  const liveParents = useMemo(() => {
    const rec: Record<string, Parent> = {}
    liveMembers.forEach((m, i) => { rec[String(m.id)] = memberToParent(m, i) })
    return rec
  }, [liveMembers])

  const parentsMap = LIVE ? liveParents : demoParents
  const me = LIVE ? (liveMe ? memberToParent(liveMe, liveMembers.findIndex((m) => m.id === liveMe.id)) : demoParents.me) : demoParents.me
  const week = LIVE ? toPlans(liveWeekStart, livePlans, liveSwaps, myId, todayDow()) : demoWeek
  const school = LIVE ? (liveGroup?.school ?? '') : '한빛초등학교'
  const groupName = LIVE ? (liveGroup?.name ?? '') : '한빛초 카풀'

  const todayPlan = week.find((d) => d.today)
  const stops: Stop[] = LIVE ? toStops(todayPlan?.riders ?? [], school, liveEvents) : demoTripStops
  const tripDone = LIVE ? liveEvents.length : demoTripDone

  const store = useMemo<Store>(() => ({
    mode: LIVE ? 'live' : 'demo',
    tab,
    setTab,
    profileId,
    openProfile,
    onboarded,
    finishOnboarding: () => {
      setOnboarded(true)
      try { localStorage.setItem(ONBOARD_KEY, '1') } catch { /* 사생활 보호 모드 등 */ }
    },
    loggedIn: LIVE ? loggedIn : true,
    loading,
    me,
    parents: parentsMap,
    groupName,
    school,
    week,
    acceptSwap: (swapId: string) => {
      if (LIVE) {
        api.acceptSwap(Number(swapId)).then(refetchWeek).catch((e) => handleError(e, '교환을 수락하지 못했어요'))
        return
      }
      setDemoWeek((w) => {
        const wed = w.find((d) => d.day === '수')
        const thu = w.find((d) => d.day === '목')
        if (!wed?.swap || wed.swap.id !== swapId || !thu) return w
        return w.map((d) => {
          if (d.day === '수') return { ...d, driverId: thu.driverId, mine: true, swap: undefined }
          if (d.day === '목') return { ...d, driverId: wed.driverId, mine: false }
          return d
        })
      })
      showToast('수요일 당번을 맡기로 했어요')
    },
    requestSwap: (fromDow: number, toDow: number, reason: string) => {
      if (!LIVE) {
        showToast('데모에서는 새 교환 요청을 만들 수 없어요')
        return
      }
      api.requestSwap(fromDow, toDow, reason)
        .then(() => { showToast('교환을 요청했어요'); refetchWeek() })
        .catch((e) => handleError(e, '교환을 요청하지 못했어요'))
    },
    stops,
    tripDone,
    tripActive,
    isDriver,
    startTrip: (kind: '등원' | '하원') => {
      if (!LIVE) return
      api.startTrip(kind)
        .then(() => { setTrack([]); return refetchTrip() })
        .catch((e) => handleError(e, '운행을 시작하지 못했어요'))
    },
    markNextStop: () => {
      if (!LIVE || !liveTrip) return
      const next = stops[liveEvents.length]
      if (!next) return
      api.tripEvent(liveTrip.id, next.label)
        .then(refetchTrip)
        .catch((e) => handleError(e, '기록하지 못했어요'))
    },
    endTrip: () => {
      if (!LIVE || !liveTrip) return
      api.endTrip(liveTrip.id)
        .then(() => { setTrack([]); return refetchTrip() })
        .catch((e) => handleError(e, '운행을 종료하지 못했어요'))
    },
    track,
    auth: {
      login: async (phone: string, password: string) => {
        const { token } = await api.login(phone, password)
        setToken(token)
        setLoggedIn(true)
      },
      register: async (form: RegisterForm) => {
        const { token } = await api.register(form)
        setToken(token)
        setLoggedIn(true)
      },
      logout: () => {
        setToken(null)
        setLoggedIn(false)
        setLiveMe(null)
        setLiveGroup(null)
        setLiveMembers([])
        setLivePlans([])
        setLiveSwaps([])
        setLiveTrip(null)
        setLiveEvents([])
        setTrack([])
      },
    },
    toastMsg,
    toast: showToast,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    tab, profileId, onboarded, loggedIn, loading, me, parentsMap, groupName, school, week,
    stops, tripDone, tripActive, isDriver, track, toastMsg, liveTrip, liveEvents,
  ])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider missing')
  return s
}
