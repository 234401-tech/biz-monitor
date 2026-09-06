import { CarIcon, ShieldIcon } from '../icons'
import { useStore } from '../store'

export function MyPage() {
  const { week, me, mode, auth } = useStore()
  const myDays = week.filter((d) => d.mine).map((d) => `${d.day}요일`).join(', ')

  return (
    <div className="screen">
      <div style={{ padding: '28px 24px 0' }}>
        <div className="jua" style={{ fontSize: 24 }}>내 정보</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 24px 0' }}>
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="avatar" style={{ width: 56, height: 56, borderRadius: 18, background: me.bg, color: me.fg, fontSize: 22 }}>{me.initial}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{me.label}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{me.children?.split(',').map((s) => s.trim()).join(' · ')}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--green-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldIcon color="var(--green)" size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>신원 · 면허 · 보험 인증 완료</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>최근 갱신 2026년 8월</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CarIcon size={20} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{me.vehicle}</div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, background: 'var(--yellow-tint)',
          border: '1px solid var(--yellow-line)', borderRadius: 16, padding: '14px 16px', fontSize: 14, lineHeight: 1.5,
        }}>
          이번 주 운전 당번: <b>{myDays || '없음'}</b>
        </div>

        {mode === 'live' && (
          <button className="btn btn-outline" onClick={auth.logout}>로그아웃</button>
        )}
      </div>
    </div>
  )
}
