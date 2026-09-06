import { StoreProvider, Tab, useStore } from './store'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { Tracking } from './screens/Tracking'
import { Schedule } from './screens/Schedule'
import { Group } from './screens/Group'
import { MyPage } from './screens/MyPage'
import { Profile } from './screens/Profile'
import { CalendarIcon, GroupIcon, HomeIcon, PinIcon, UserIcon } from './icons'

const tabs: { id: Tab; label: string; icon: typeof HomeIcon }[] = [
  { id: 'home', label: '홈', icon: HomeIcon },
  { id: 'schedule', label: '일정', icon: CalendarIcon },
  { id: 'tracking', label: '위치', icon: PinIcon },
  { id: 'group', label: '그룹', icon: GroupIcon },
  { id: 'my', label: '내 정보', icon: UserIcon },
]

function Shell() {
  const { tab, setTab, onboarded, profileId, toastMsg } = useStore()

  if (!onboarded) {
    return (
      <div className="phone">
        <Onboarding />
        {toastMsg && <div className="toast">{toastMsg}</div>}
      </div>
    )
  }

  return (
    <div className="phone">
      {tab === 'home' && <Home />}
      {tab === 'schedule' && <Schedule />}
      {tab === 'tracking' && <Tracking />}
      {tab === 'group' && <Group />}
      {tab === 'my' && <MyPage />}

      <nav className="tabbar">
        {tabs.map((t) => {
          const Icon = t.icon
          const on = tab === t.id
          return (
            <button key={t.id} className={on ? 'on' : ''} onClick={() => setTab(t.id)}>
              <Icon size={22} strokeWidth={on ? 2 : 1.8} />
              {t.label}
            </button>
          )
        })}
      </nav>

      {profileId && <Profile id={profileId} />}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
