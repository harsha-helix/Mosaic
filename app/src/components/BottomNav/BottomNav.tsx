import { NavLink, useLocation } from 'react-router-dom'
import { HomeIcon, HighlightsIcon, InsightsIcon, SearchIcon, SettingsIcon } from '../icons/Icons'

const NAV_ITEMS = [
  { path: '/',           label: 'Home',       Icon: HomeIcon },
  { path: '/highlights', label: 'Highlights', Icon: HighlightsIcon },
  { path: '/insights',   label: 'Insights',   Icon: InsightsIcon },
  { path: '/search',     label: 'Search',     Icon: SearchIcon },
  { path: '/settings',   label: 'Settings',   Icon: SettingsIcon },
]

const ACTIVE = 'var(--color-terracotta)'
const INACTIVE = 'var(--color-hint)'

export function BottomNav() {
  const location = useLocation()

  // Hide nav on full-screen flows
  const HIDE_ON = ['/morning', '/evening', '/onboarding']
  if (HIDE_ON.some(p => location.pathname.startsWith(p))) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-hairline dark:border-hairline-dark bg-surface dark:bg-surface-dark lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path)
          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-0"
            >
              <Icon size={22} color={isActive ? ACTIVE : INACTIVE} />
              <span
                className={`text-[11px] truncate transition-colors ${
                  isActive
                    ? 'text-terracotta font-semibold'
                    : 'text-hint dark:text-hint-dark font-medium'
                }`}
              >
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
