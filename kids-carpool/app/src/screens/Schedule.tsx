import { DayPlan, parents } from '../data'
import { SwapIcon } from '../icons'
import { useStore } from '../store'

export function Schedule() {
  const { week, acceptSwap, openProfile, toast } = useStore()

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 24px 0' }}>
        <div className="jua" style={{ fontSize: 24 }}>주간 당번표</div>
        <button
          className="card"
          style={{ height: 44, padding: '0 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--green)' }}
          onClick={() => toast('바꾸고 싶은 날을 눌러 요청해 보세요')}
        >
          <SwapIcon size={16} color="var(--green)" strokeWidth={2} />
          당번 바꾸기
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 24px 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>9월 7일 – 11일</div>
        <div className="badge" style={{ background: 'var(--green-tint)', color: 'var(--green)', fontSize: 12 }}>한빛초 카풀 · 5가족</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 24px 0' }}>
        {week.map((d) => <DayCard key={d.day} plan={d} onAccept={acceptSwap} onProfile={openProfile} />)}
      </div>
    </div>
  )
}

function DayCard({ plan, onAccept, onProfile }: {
  plan: DayPlan
  onAccept: () => void
  onProfile: (id: string) => void
}) {
  const driver = parents[plan.driverId]
  const mineStyle = plan.mine
    ? { background: '#FFFDF6', border: '2px solid var(--yellow)' }
    : undefined

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
              {plan.mine ? '민준 어머니(나)' : driver.label}{' '}
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
        {plan.swap && (
          <button
            className="btn btn-primary"
            style={{ minHeight: 44, padding: '0 14px', fontSize: 13, borderRadius: 12, flexShrink: 0 }}
            onClick={onAccept}
          >
            수락
          </button>
        )}
      </div>
    </div>
  )
}
