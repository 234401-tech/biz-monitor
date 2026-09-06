import type { ReactNode } from 'react'

type IconProps = { size?: number; color?: string; strokeWidth?: number }

function icon(paths: ReactNode) {
  return function Icon({ size = 22, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
    return (
      <svg
        width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      >
        {paths}
      </svg>
    )
  }
}

export const HomeIcon = icon(<><path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>)

export const CalendarIcon = icon(
  <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4" /><path d="M16 3v4" /><path d="M3 11h18" /></>,
)

export const PinIcon = icon(
  <><path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10z" /><circle cx="12" cy="11" r="2.4" /></>,
)

export const GroupIcon = icon(
  <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><circle cx="17" cy="9" r="2.4" /><path d="M16 15.2c2.6 0 4.5 1.8 4.5 4.3" /></>,
)

export const UserIcon = icon(<><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" /></>)

export const BellIcon = icon(
  <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M10.3 20a2 2 0 0 0 3.4 0" /></>,
)

export const ShieldIcon = icon(
  <><path d="M12 3l7 3v5c0 4.5-3 8.2-7 9.5-4-1.3-7-5-7-9.5V6z" /><path d="M9 12l2 2 4-4" /></>,
)

export const ChatIcon = icon(
  <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.5-.7L3 21l1.8-4.5A8.4 8.4 0 1 1 21 11.5z" />,
)

export const PhoneIcon = icon(
  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" />,
)

export const CarIcon = icon(
  <><path d="M4 16V10a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6" /><path d="M2 16h20v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" /><circle cx="7.5" cy="19" r="1.4" /><circle cx="16.5" cy="19" r="1.4" /></>,
)

export const SwapIcon = icon(
  <><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
)

export const BackIcon = icon(<path d="M15 5l-7 7 7 7" />)

export const CheckIcon = icon(<path d="M5 13l4 4 10-10" />)

export const ClockIcon = icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>)

export const ChevronIcon = icon(<path d="M9 5l7 7-7 7" />)
