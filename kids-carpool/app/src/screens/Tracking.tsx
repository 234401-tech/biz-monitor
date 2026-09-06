import { parents, SCHOOL, stopPoints, tripStops } from '../data'
import { BackIcon, CheckIcon, PhoneIcon } from '../icons'
import { useStore } from '../store'

export function Tracking() {
  const { tripDone, setTab, openProfile, toast } = useStore()
  const driver = parents.jisu
  const arrived = tripDone >= tripStops.length
  const busPos = stopPoints[Math.min(tripDone, stopPoints.length - 1)]
  const etaMin = Math.max(0, (tripStops.length - tripDone) * 3)

  return (
    <div className="screen" style={{ background: 'var(--map)', paddingBottom: 0, minHeight: '100dvh' }}>
      <div style={{ position: 'relative', flexGrow: 1, minHeight: 380, overflow: 'hidden' }}>
        <svg viewBox="0 0 390 520" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
          <rect width="390" height="520" fill="var(--map)" />
          <rect x="24" y="40" width="120" height="88" rx="10" fill="var(--map-block)" />
          <rect x="24" y="150" width="120" height="130" rx="10" fill="var(--map-block)" />
          <rect x="250" y="60" width="120" height="110" rx="10" fill="var(--map-block)" />
          <rect x="250" y="200" width="120" height="90" rx="10" fill="#D3E4DB" />
          <rect x="40" y="330" width="140" height="120" rx="10" fill="var(--map-block)" />
          <rect x="240" y="330" width="130" height="150" rx="10" fill="var(--map-block)" />
          <path d="M0 310 H390" stroke="#fff" strokeWidth="18" />
          <path d="M195 0 V520" stroke="#fff" strokeWidth="22" />
          <path d="M0 140 H180" stroke="#fff" strokeWidth="12" />
          <path d="M210 180 H390" stroke="#fff" strokeWidth="12" />
          <path d="M195 470 C 195 430, 160 420, 120 420 C 90 420, 80 380, 80 350" stroke="#fff" strokeWidth="12" fill="none" />
          <path d="M195 460 V310 H310" stroke="var(--green)" strokeWidth="5" strokeDasharray="1 9" strokeLinecap="round" fill="none" />

          <g transform="translate(310, 292)">
            <rect x="-14" y="-14" width="28" height="28" rx="9" fill="var(--green)" />
            <path d="M-6 3 L-1 8 L8 -4" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x="0" y="30" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--green)">{SCHOOL}</text>
          </g>

          <g transform="translate(112, 350)">
            <circle r="8" fill="#fff" stroke="var(--green)" strokeWidth="3" />
            <text x="0" y="-16" textAnchor="middle" fontSize="11" fontWeight="600" fill="#4E5B54">서연이네 앞</text>
          </g>

          <g className="bus-marker" transform={`translate(${busPos.x}, ${busPos.y})`}>
            <circle r="26" fill="var(--yellow)" opacity="0.35" />
            <circle r="17" fill="var(--yellow)" stroke="#fff" strokeWidth="3" />
            <g transform="translate(-8, -7)">
              <path d="M1 10V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5z" fill="none" stroke="var(--ink)" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M0 10h16v2h-16z" fill="var(--ink)" />
              <circle cx="4" cy="13.5" r="1.4" fill="var(--ink)" />
              <circle cx="12" cy="13.5" r="1.4" fill="var(--ink)" />
            </g>
          </g>
        </svg>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '28px 24px 0' }}>
          <button
            aria-label="뒤로"
            style={{ width: 44, height: 44, borderRadius: 14, background: '#fff', boxShadow: '0 4px 12px rgba(38,49,44,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setTab('home')}
          >
            <BackIcon size={20} />
          </button>
          <div style={{
            height: 44, padding: '0 18px', borderRadius: 22, background: '#fff',
            boxShadow: '0 4px 12px rgba(38,49,44,0.12)', display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 14, fontWeight: 700,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: arrived ? 'var(--faint)' : '#2E9E6B' }} />
            {arrived ? '운행 종료' : '등원 운행 중'}
          </div>
        </div>
      </div>

      <div style={{
        position: 'relative', background: '#fff', borderRadius: '24px 24px 0 0',
        boxShadow: '0 -10px 30px rgba(38,49,44,0.12)', padding: '12px 24px calc(96px + env(safe-area-inset-bottom))',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: 'var(--line)', alignSelf: 'center' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{SCHOOL}까지</div>
            <div className="jua" style={{ fontSize: 30, color: 'var(--green)' }}>
              {arrived ? '도착 완료' : <>{etaMin}분 <span style={{ fontSize: 16, color: 'var(--ink)' }}>· 1.8km</span></>}
            </div>
          </div>
          <div style={{ padding: '8px 14px', borderRadius: 12, background: 'var(--green-tint)', color: 'var(--green)', fontSize: 13, fontWeight: 700 }}>
            {arrived ? '08:07 도착' : '08:07 도착 예정'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg)', borderRadius: 16, padding: '14px 16px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 14, flexGrow: 1 }} onClick={() => openProfile(driver.id)}>
            <div className="avatar" style={{ width: 48, height: 48, borderRadius: 16, background: driver.bg, color: driver.fg, fontSize: 18 }}>
              {driver.initial}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{driver.label} · {driver.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{driver.vehicle?.model} · {driver.vehicle?.plate}</div>
            </div>
          </button>
          <button
            aria-label="전화하기"
            style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onClick={() => toast('데모에서는 전화 연결을 하지 않아요')}
          >
            <PhoneIcon color="#fff" size={20} />
          </button>
        </div>

        <div>
          {tripStops.map((s, i) => {
            const done = i < tripDone
            const next = i === tripDone
            return (
              <div key={s.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 26 }}>
                  {done ? (
                    <div style={{ width: 22, height: 22, borderRadius: 11, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckIcon color="#fff" size={12} strokeWidth={3} />
                    </div>
                  ) : (
                    <div style={{
                      width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                      background: next ? 'var(--yellow-tint)' : '#fff',
                      border: next ? '2px solid var(--yellow)' : '2px solid var(--line)',
                    }} />
                  )}
                  {i < tripStops.length - 1 && <div style={{ width: 2, height: 22, background: 'var(--line)' }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexGrow: 1, paddingTop: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: done ? 'var(--ink)' : 'var(--muted)' }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{done ? s.time : `${s.time} 예정`}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
