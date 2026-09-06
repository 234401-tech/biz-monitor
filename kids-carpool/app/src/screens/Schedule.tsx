import { useState } from 'react'
import { DayPlan, Parent } from '../data'
import { SwapIcon } from '../icons'
import { useStore } from '../store'

export function Schedule() {
  const { week, parents, me, groupName, acceptSwap, requestSwap, openProfile, toast, mode } = useStore()
  const [swapOpen, setSwapOpen] = useState(false)

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 24px 0' }}>
        <div className="jua" style={{ fontSize: 24 }}>주간 당번표</div>
        <button
          className="card"
          style={{ height: 44, padding: '0 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--green)' }}
          onClick={() => (mode === 'live' ? setSwapOpen(true) : toast('바꾸고 싶은 날을 눌러 요청해 보세요'))}
        >
          <SwapIcon size={16} color="var(--green)" strokeWidth={2} />
          당번 바꾸기
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 24px 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>
          {week[0]?.date} – {week[week.length - 1]?.date.replace(/^\d+월\s*/, '')}
        </div>
        <div className="badge" style={{ background: 'var(--green-tint)', color: 'var(--green)', fontSize: 12 }}>
          {groupName} · {Object.keys(parents).length}가족
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 24px 0' }}>
        {week.map((d) => (
          <DayCard key={d.day} plan={d} me={me} parents={parents} onAccept={acceptSwap} onProfile={openProfile} />
        ))}
      </div>

      {swapOpen && (
        <SwapSheet
          week={week}
          onClose={() => setSwapOpen(false)}
          onSubmit={(fromDow, toDow, reason) => { requestSwap(fromDow, toDow, reason); setSwapOpen(false) }}
        />
      )}
    </div>
  )
}

function DayCard({ plan, me, parents, onAccept, onProfile }: {
  plan: DayPlan
  me: Parent
  parents: Record<string, Parent>
  onAccept: (swapId: string) => void
  onProfile: (id: string) => void
}) {
  const driver = parents[plan.driverId]
  const mineStyle = plan.mine
    ? { background: '#FFFDF6', border: '2px solid var(--yellow)' }
    : undefined
  if (!driver) return null

  return (
    <div className="card" style={{ borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, ...mineStyle }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)' }}>
          {plan.day} <span style={{ color: 'var(--ink)', marginLeft: 4 }}>{plan.date}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {plan.today && <div className="badge" style={{ background: 'var(--green-tint)', color: 'var(--green)' }}>오늘</div>}
          {plan.mine && <div className="badge" style={{ background: 'var(--yellow)', color: 'var(--ink)' }}>우리 집 당번</div>}
          {plan.swap && <div className="badge" style={{ background: 'var(--red-tint)', color: 'var(--red)' }}>교환 요청 중</div>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => onProfile(driver.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, flexGrow: 1 }}>
          <div className="avatar" style={{ width: 40, height: 40, background: driver.bg, color: driver.fg, fontSize: 16 }}>
            {driver.initial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {plan.mine ? `${me.label}(나)` : driver.label}{' '}
              <span style={{ fontWeight: 400, color: 'var(--muted)' }}>
                {plan.swap ? `· ${plan.swap.reason}` : '· 등원 07:50 / 하원 15:00'}
              </span>
            </div>
            {plan.swap ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{plan.swap.proposal}</div>
            ) : plan.note ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{plan.note}</div>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                {plan.riders.map((r) => <div key={r} className="chip">{r}</div>)}
              </div>
            )}
          </div>
        </button>
        {plan.swap && (plan.swap.canAccept ?? true) && (
          <button
            className="btn btn-primary"
            style={{ minHeight: 44, padding: '0 14px', fontSize: 13, borderRadius: 12, flexShrink: 0 }}
            onClick={() => onAccept(plan.swap!.id)}
          >
            수락
          </button>
        )}
      </div>
    </div>
  )
}

// 라이브 전용: 내 당번인 날을 바꿀 요일과 사유를 입력하는 간단한 시트
function SwapSheet({ week, onClose, onSubmit }: {
  week: DayPlan[]
  onClose: () => void
  onSubmit: (fromDow: number, toDow: number, reason: string) => void
}) {
  const days = week.map((d, i) => ({ dow: i + 1, ...d }))
  const myDays = days.filter((d) => d.mine)
  const [fromDow, setFromDow] = useState<number | null>(myDays[0]?.dow ?? null)
  const [toDow, setToDow] = useState<number | null>(null)
  const [reason, setReason] = useState('')

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ padding: '28px 24px calc(24px + env(safe-area-inset-bottom))', gap: 16 }}>
        <div className="jua" style={{ fontSize: 20 }}>당번 바꾸기</div>

        {myDays.length === 0 ? (
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>이번 주에는 내 당번인 날이 없어요.</div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>내 당번인 날</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {myDays.map((d) => (
                  <button key={d.dow} className={d.dow === fromDow ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ flex: 1, minHeight: 44 }} onClick={() => setFromDow(d.dow)}>{d.day}요일</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>바꿀 요일</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {days.filter((d) => d.dow !== fromDow).map((d) => (
                  <button key={d.dow} className={d.dow === toDow ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ flex: 1, minHeight: 44, fontSize: 13 }} onClick={() => setToDow(d.dow)}>{d.day}요일</button>
                ))}
              </div>
            </div>

            <input
              placeholder="사유 (예: 병원 일정)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ minHeight: 48 }}
            />

            <button
              className="btn btn-primary"
              disabled={!fromDow || !toDow}
              style={{ opacity: !fromDow || !toDow ? 0.5 : 1 }}
              onClick={() => fromDow && toDow && onSubmit(fromDow, toDow, reason)}
            >
              교환 요청 보내기
            </button>
          </>
        )}
      </div>
    </div>
  )
}
