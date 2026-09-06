import { parents } from '../data'
import { BackIcon, CarIcon, ChatIcon, CheckIcon, PhoneIcon, ShieldIcon } from '../icons'
import { useStore } from '../store'

export function Profile({ id }: { id: string }) {
  const { openProfile, toast } = useStore()
  const p = parents[id]
  if (!p) return null

  return (
    <div className="overlay" onClick={() => openProfile(null)}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '28px 24px 0' }}>
          <button
            aria-label="뒤로"
            className="card"
            style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => openProfile(null)}
          >
            <BackIcon size={20} />
          </button>
          <div className="jua" style={{ fontSize: 22 }}>이웃 프로필</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 24px 0' }}>
          <div className="card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <div className="avatar" style={{ width: 84, height: 84, borderRadius: 28, background: p.bg, color: p.fg, fontSize: 32 }}>{p.initial}</div>
              <div style={{
                position: 'absolute', right: -6, bottom: -6, width: 30, height: 30, borderRadius: 15,
                background: 'var(--green)', border: '3px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckIcon color="#fff" size={14} strokeWidth={3} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{p.name} <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--muted)' }}>{p.label}</span></div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>한빛초 카풀 · {p.apt}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--green-tint)', borderRadius: 12, padding: '10px 16px' }}>
              <ShieldIcon size={18} color="var(--green)" strokeWidth={2} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>신원 · 면허 · 보험 인증 완료</div>
            </div>
          </div>

          {p.vehicle && (
            <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CarIcon size={24} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{p.vehicle.model} · {p.vehicle.plate}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.vehicle.seats}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ flexGrow: 1 }} />

        <div style={{ display: 'flex', gap: 12, padding: '0 24px calc(24px + env(safe-area-inset-bottom))' }}>
          <button className="btn btn-outline" style={{ flex: 1, minHeight: 54 }} onClick={() => toast('데모에서는 채팅이 열리지 않아요')}>
            <ChatIcon size={18} color="var(--green)" />
            메시지
          </button>
          <button className="btn btn-primary" style={{ flex: 1, minHeight: 54 }} onClick={() => toast('데모에서는 전화 연결을 하지 않아요')}>
            <PhoneIcon size={18} color="#fff" />
            전화하기
          </button>
        </div>
      </div>
    </div>
  )
}
