import { useState } from 'react'
import { useStore } from '../store'
import type { RegisterForm } from '../store'

export function Login() {
  const { auth, toast } = useStore()
  const [tabMode, setTabMode] = useState<'login' | 'register'>('login')
  const [busy, setBusy] = useState(false)

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const [form, setForm] = useState<RegisterForm>({
    inviteCode: '', phone: '', password: '', name: '', label: '', children: '', vehicle: '', apt: '',
  })

  const submitLogin = async () => {
    setBusy(true)
    try {
      await auth.login(phone, password)
    } catch (e) {
      toast(e instanceof Error ? e.message : '로그인에 실패했어요')
    } finally {
      setBusy(false)
    }
  }

  const submitRegister = async () => {
    setBusy(true)
    try {
      await auth.register(form)
    } catch (e) {
      toast(e instanceof Error ? e.message : '가입에 실패했어요')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen" style={{ paddingBottom: 40 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '56px 32px 0' }}>
        <div className="jua" style={{ fontSize: 28 }}>같이타요</div>
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>우리 아이 등하원, 믿을 수 있는 이웃과 함께</div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '32px 24px 0' }}>
        <button
          className={tabMode === 'login' ? 'btn btn-primary' : 'btn btn-outline'}
          style={{ flex: 1 }}
          onClick={() => setTabMode('login')}
        >
          로그인
        </button>
        <button
          className={tabMode === 'register' ? 'btn btn-primary' : 'btn btn-outline'}
          style={{ flex: 1 }}
          onClick={() => setTabMode('register')}
        >
          가입하기
        </button>
      </div>

      {tabMode === 'login' ? (
        <div className="card" style={{ margin: '20px 24px 0', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input placeholder="전화번호" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input placeholder="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn btn-primary" disabled={busy} onClick={submitLogin}>로그인</button>
        </div>
      ) : (
        <div className="card" style={{ margin: '20px 24px 0', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input placeholder="초대 코드" value={form.inviteCode} onChange={(e) => setForm({ ...form, inviteCode: e.target.value })} />
          <input placeholder="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="호칭 (예: 민준 어머니)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <input placeholder="아이 (예: 김민준(초2), 김소윤(6세))" value={form.children} onChange={(e) => setForm({ ...form, children: e.target.value })} />
          <input placeholder="차량 (예: 기아 카니발 · 32루 4568)" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} />
          <input placeholder="동 (예: 102동)" value={form.apt} onChange={(e) => setForm({ ...form, apt: e.target.value })} />
          <input placeholder="전화번호" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="비밀번호 (8자 이상)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="btn btn-primary" disabled={busy} onClick={submitRegister}>가입하기</button>
        </div>
      )}
    </div>
  )
}
