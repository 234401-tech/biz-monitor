import { ShieldIcon, PinIcon, BellIcon } from '../icons'
import { useStore } from '../store'

const points = [
  {
    icon: <ShieldIcon color="var(--green)" />, tint: 'var(--green-tint)',
    title: '신원 인증을 마친 이웃 부모', desc: '신분증 · 면허 · 보험 확인',
  },
  {
    icon: <PinIcon color="var(--amber)" />, tint: 'var(--yellow-tint)',
    title: '운행 내내 실시간 위치 공유', desc: '지도에서 우리 아이 이동을 바로 확인',
  },
  {
    icon: <BellIcon color="var(--green)" />, tint: 'var(--green-tint)',
    title: '승차·하차 순간마다 자동 알림', desc: '탑승 완료, 학교 도착까지 놓치지 않아요',
  },
]

export function Onboarding() {
  const { finishOnboarding, toast } = useStore()
  return (
    <div className="screen" style={{ paddingBottom: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '84px 32px 0' }}>
        <div style={{
          width: 96, height: 96, background: 'var(--yellow)', borderRadius: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(255,198,63,0.45)',
        }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 16V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8" />
            <path d="M3 16h18v2a1 1 0 0 1-1 1h-1" />
            <path d="M5 19H4a1 1 0 0 1-1-1v-2" />
            <circle cx="7.5" cy="19" r="1.6" /><circle cx="16.5" cy="19" r="1.6" />
            <path d="M4 12h16" /><path d="M9 5v7" /><path d="M15 5v7" />
          </svg>
        </div>
        <div className="jua" style={{ fontSize: 34, letterSpacing: -0.5 }}>같이타요</div>
        <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.45, textAlign: 'center', letterSpacing: -0.3 }}>
          우리 아이 등하원,<br />믿을 수 있는 이웃과 함께
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '40px 24px 0' }}>
        {points.map((p) => (
          <div key={p.title} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 16, padding: '16px 18px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: p.tint,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {p.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ flexGrow: 1 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '24px 24px 40px' }}>
        <button className="btn btn-primary" style={{ minHeight: 56, justifyContent: 'center', textAlign: 'center' }} onClick={finishOnboarding}>
          시작하기
        </button>
        <button
          style={{ minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: 'var(--green)' }}
          onClick={() => toast('데모에서는 초대 코드 입력을 건너뛰어요')}
        >
          이미 카풀 그룹 초대를 받았어요
        </button>
      </div>
    </div>
  )
}
