export type Parent = {
  id: string
  name: string
  label: string
  initial: string
  bg: string
  fg: string
  apt: string
  vehicle?: string
  children?: string
  verified?: boolean
}

export type DayPlan = {
  day: string
  date: string
  driverId: string
  riders: string[]
  today?: boolean
  mine?: boolean
  note?: string
  swap?: { id: string; reason: string; proposal: string; canAccept?: boolean }
}

export const SCHOOL = '한빛초등학교'

export const parents: Record<string, Parent> = {
  jisu: {
    id: 'jisu', name: '김은정', label: '지수 어머니', initial: '지',
    bg: 'var(--green-tint)', fg: 'var(--green)', apt: '같은 아파트 102동', verified: true,
    vehicle: '기아 카니발 · 32루 4568 · 카시트 2개 · 7인승',
  },
  doyun: {
    id: 'doyun', name: '박성호', label: '도윤 아버지', initial: '도',
    bg: 'var(--yellow-tint)', fg: 'var(--amber)', apt: '같은 아파트 105동', verified: true,
    vehicle: '현대 팰리세이드 · 17도 8214 · 주니어시트 2개 · 7인승',
  },
  seoyeon: {
    id: 'seoyeon', name: '이수진', label: '서연 어머니', initial: '서',
    bg: '#E8E3F4', fg: '#6B5CA8', apt: '같은 아파트 102동', verified: true,
    vehicle: '기아 쏘렌토 · 45마 1027 · 카시트 1개 · 5인승',
  },
  me: {
    id: 'me', name: '나 (민준 어머니)', label: '민준 어머니', initial: '민',
    bg: 'var(--yellow)', fg: 'var(--ink)', apt: '102동', verified: true,
    vehicle: '기아 쏘렌토 · 52너 3391 · 카시트 1개 · 5인승', children: '김민준(초2), 김소윤(6세)',
  },
  haram: {
    id: 'haram', name: '최유나', label: '하람 어머니', initial: '하',
    bg: 'var(--green-tint)', fg: 'var(--green)', apt: '같은 아파트 103동', verified: true,
    vehicle: '기아 스포티지 · 28수 7745 · 주니어시트 1개 · 5인승',
  },
}

export const initialWeek: DayPlan[] = [
  { day: '월', date: '9월 7일', driverId: 'jisu', riders: ['지수', '민준', '서연', '도윤'], today: true },
  { day: '화', date: '9월 8일', driverId: 'doyun', riders: ['도윤', '민준', '서연'] },
  {
    day: '수', date: '9월 9일', driverId: 'seoyeon', riders: ['서연', '민준', '지수'],
    swap: { id: 'demo-swap', reason: '병원 일정', proposal: '목요일 당번과 맞바꾸기를 제안했어요' },
  },
  { day: '목', date: '9월 10일', driverId: 'me', riders: ['민준', '서연', '하람'], mine: true },
  { day: '금', date: '9월 11일', driverId: 'haram', riders: ['하람', '민준'], note: '금요일은 단축수업 · 하원 13:30' },
]

export type Stop = { label: string; time: string }

export const tripStops: Stop[] = [
  { label: '김민준 탑승 완료', time: '07:52' },
  { label: '이서연 탑승 완료', time: '07:58' },
  { label: '박도윤 탑승 · 도윤이네 앞', time: '08:01' },
  { label: `${SCHOOL} 도착 · 하차 완료`, time: '08:07' },
]

// 지도 위 정류장 좌표 (SVG viewBox 390x520 기준)
export const stopPoints = [
  { x: 195, y: 470 },
  { x: 112, y: 350 },
  { x: 195, y: 380 },
  { x: 310, y: 310 },
]
