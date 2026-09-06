import { ChevronIcon, ShieldIcon } from '../icons'
import { useStore } from '../store'

export function Group() {
  const { parents, me, groupName, openProfile } = useStore()
  const members = Object.values(parents).filter((p) => p.id !== me.id)

  return (
    <div className="screen">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '28px 24px 0' }}>
        <div className="jua" style={{ fontSize: 24 }}>{groupName}</div>
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>{Object.keys(parents).length}가족 · 같은 아파트 단지</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 24px 0' }}>
        {members.map((p) => (
          <button key={p.id} className="card" style={{ borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
            onClick={() => openProfile(p.id)}>
            <div className="avatar" style={{ width: 44, height: 44, background: p.bg, color: p.fg, fontSize: 17 }}>{p.initial}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexGrow: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{p.label} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{p.name}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
                <ShieldIcon size={13} color="var(--green)" strokeWidth={2} />
                인증 완료 · {p.apt}
              </div>
            </div>
            <ChevronIcon size={18} color="var(--faint)" />
          </button>
        ))}
      </div>
    </div>
  )
}
