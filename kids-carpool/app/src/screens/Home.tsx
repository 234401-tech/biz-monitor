import { BellIcon, CalendarIcon, ChatIcon, CheckIcon, ClockIcon, PinIcon } from '../icons'
import { useStore } from '../store'

// "김민준(초2), 김소윤(6세)" 형태의 문자열을 칩 목록으로 바꾼다
function parseChildren(children?: string): { name: string; grade: string }[] {
  if (!children) return []
  return children.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
    const m = s.match(/^(.*?)\((.*?)\)$/)
    return m ? { name: m[1], grade: m[2] } : { name: s, grade: '' }
  })
}

export function Home() {
  const { week, parents, me, tripDone, tripActive, isDriver, stops, mode, startTrip, setTab, openProfile, toast } = useStore()
  const today = week.find((d) => d.today) ?? week[0]
  const driver = parents[today.driverId]
  const mine = week.find((d) => d.mine)
  const arrived = tripActive && tripDone >= stops.length
  const kids = parseChildren(me.children)

  const steps = [
    { label: '배차 확정', state: 'done' },
    { label: !tripActive ? '출발 전' : arrived ? '탑승 완료' : '탑승 중', state: !tripActive ? 'todo' : arrived ? 'done' : 'now' },
    { label: '학교 도착', state: arrived ? 'done' : 'todo' },
  ]

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 24px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>{today.date} {today.day}요일</div>
          <div className="jua" style={{ fontSize: 24, letterSpacing: -0.3 }}>오늘도 좋은 아침이에요</div>
        </div>
        <button
          aria-label="알림"
          className="card"
          style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => toast('새 알림이 없어요')}
        >
          <BellIcon />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '18px 24px 0' }}>
        {kids.map((k, i) => (
          <div key={k.name} style={i === 0 ? {
            height: 44, padding: '0 18px', borderRadius: 22, background: 'var(--green)', color: '#fff',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600,
          } : {
            height: 44, padding: '0 18px', borderRadius: 22, color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600,
          }}>
            <div className="avatar" style={{
              width: 24, height: 24, borderRadius: 12, fontSize: 12,
              background: i === 0 ? 'var(--yellow)' : 'var(--green-tint)', color: i === 0 ? 'var(--ink)' : 'var(--green)',
            }}>{k.name.length >= 3 ? k.name.charAt(1) : k.name.charAt(0)}</div>
            {k.name}{k.grade && ` · ${k.grade}`}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 24px 0' }}>
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 6px 18px rgba(38,49,44,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="badge" style={{ background: 'var(--yellow-tint)', color: 'var(--amber)', fontSize: 12, padding: '5px 10px' }}>오늘 등원</div>
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>{arrived ? '운행 완료' : tripActive ? '07:50 출발' : '출발 전'}</div>
          </div>

          <button style={{ display: 'flex', alignItems: 'center', gap: 14 }} onClick={() => openProfile(driver.id)}>
            <div className="avatar" style={{ width: 52, height: 52, borderRadius: 16, background: driver.bg, color: driver.fg, fontSize: 20 }}>
              {driver.initial}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>오늘 운전: {driver.label}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{driver.vehicle}</div>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {steps.map((s, i) => (
              <StepDot key={s.label} index={i + 1} label={s.label} state={s.state as 'done' | 'now' | 'todo'} last={i === steps.length - 1} />
            ))}
          </div>

          <button className="btn btn-primary" onClick={() => setTab('tracking')}>
            <PinIcon color="#fff" size={18} />
            실시간 위치 보기
          </button>

          {mode === 'live' && isDriver && !tripActive && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => startTrip('등원')}>등원 운행 시작</button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => startTrip('하원')}>하원 운행 시작</button>
            </div>
          )}
        </div>

        {mine && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, background: 'var(--yellow-tint)',
            border: '1px solid var(--yellow-line)', borderRadius: 16, padding: '14px 16px',
          }}>
            <ClockIcon color="var(--amber)" />
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              <b>이번 주 {mine.day}요일은 우리 집 운전 당번</b>이에요. 하원 15:00 · 아이 {mine.riders.length}명
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="card" style={{ flex: 1, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
            onClick={() => setTab('group')}>
            <ChatIcon color="var(--green)" />
            <div style={{ fontSize: 14, fontWeight: 700 }}>그룹 채팅</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>새 메시지 3개</div>
          </button>
          <button className="card" style={{ flex: 1, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
            onClick={() => setTab('schedule')}>
            <CalendarIcon color="var(--green)" />
            <div style={{ fontSize: 14, fontWeight: 700 }}>일정 변경 요청</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>당번 교환 · 결석 알림</div>
          </button>
        </div>
      </div>
    </div>
  )
}

function StepDot({ index, label, state, last }: { index: number; label: string; state: 'done' | 'now' | 'todo'; last: boolean }) {
  const dot = state === 'done'
    ? <div style={{ width: 26, height: 26, borderRadius: 13, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckIcon color="#fff" size={14} strokeWidth={3} /></div>
    : state === 'now'
      ? <div style={{ width: 26, height: 26, borderRadius: 13, background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{index}</div>
      : <div style={{ width: 26, height: 26, borderRadius: 13, background: '#fff', border: '2px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{index}</div>
  const color = state === 'done' ? 'var(--green)' : state === 'now' ? 'var(--ink)' : 'var(--muted)'
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
        {dot}
        <div style={{ fontSize: 11, fontWeight: 600, color }}>{label}</div>
      </div>
      {!last && <div style={{ height: 2, background: state === 'done' ? 'var(--green)' : 'var(--line)', flex: 1, margin: '0 0 22px' }} />}
    </>
  )
}
