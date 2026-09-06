// VITE_MODE=live 로 빌드하면 같은 도메인의 /api, /ws 에 붙는다. 아니면 데모(목데이터) 모드.
export const LIVE = import.meta.env.VITE_MODE === 'live'

const TOKEN_KEY = 'gachitayo.token'

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function setToken(t: string | null) {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
}

export type Member = { id: number; name: string; label: string; children: string; vehicle: string; apt: string; verified: boolean }
export type Plan = { id: number; week_start: string; dow: number; driver_id: number; riders: string[]; note: string }
export type Swap = { id: number; from_dow: number; to_dow: number; requester_id: number; reason: string }
export type Trip = { id: number; driver_id: number; kind: string; status: 'active' | 'ended'; started_at: string }
export type TripEvent = { id: number; label: string; at: string }

async function call<T>(path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) setToken(null)
    throw new Error(data.error ?? `요청 실패 (${res.status})`)
  }
  return data as T
}

export const api = {
  login: (phone: string, password: string) => call<{ token: string; user: Member }>('/api/auth/login', { phone, password }),
  register: (form: Record<string, string>) => call<{ token: string; user: Member }>('/api/auth/register', form),
  me: () => call<Member>('/api/me'),
  group: () => call<{ group: { name: string; school: string }; members: Member[] }>('/api/group'),
  week: () => call<{ weekStart: string; plans: Plan[]; swaps: Swap[] }>('/api/week'),
  requestSwap: (fromDow: number, toDow: number, reason: string) => call('/api/week/swap', { fromDow, toDow, reason }),
  acceptSwap: (id: number) => call(`/api/swap/${id}/accept`, {}),
  activeTrip: () => call<{ trip: Trip | null; events: TripEvent[] }>('/api/trips/active'),
  startTrip: (kind: string) => call<Trip>('/api/trips/start', { kind }),
  tripEvent: (id: number, label: string) => call(`/api/trips/${id}/event`, { label }),
  endTrip: (id: number) => call(`/api/trips/${id}/end`, {}),
}

export type WsMessage = { type: 'loc'; lat: number; lng: number; at: number } | { type: 'week' } | { type: 'trip' }

// 끊기면 3초 후 재접속하는 WebSocket. 반환된 함수로 종료.
export function openSocket(onMessage: (m: WsMessage) => void, sendRef?: { current: ((m: unknown) => void) | null }) {
  let ws: WebSocket | null = null
  let closed = false
  const connect = () => {
    const token = getToken()
    if (!token || closed) return
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    ws = new WebSocket(`${proto}://${location.host}/ws?token=${encodeURIComponent(token)}`)
    ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)) } catch { /* ignore */ } }
    ws.onclose = () => { if (!closed) setTimeout(connect, 3000) }
    if (sendRef) sendRef.current = (m) => { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(m)) }
  }
  connect()
  return () => { closed = true; ws?.close() }
}
