import { NavLink, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/',           label: 'Home',       icon: '🏠' },
  { path: '/highlights', label: 'Highlights', icon: '✨' },
  { path: '/insights',   label: 'Insights',   icon: '📊' },
  { path: '/search',     label: 'Search',     icon: '🔍' },
  { path: '/settings',   label: 'Settings',   icon: '⚙️' },
]

export function BottomNav() {
  const location = useLocation()

  // Hide nav on full-screen flows
  const HIDE_ON = ['/morning', '/evening', '/onboarding']
  if (HIDE_ON.some(p => location.pathname.startsWith(p))) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E8E8E8] dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ path, label, icon }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path)
          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-0"
            >
              <span className="text-xl leading-none">{icon}</span>
              <span
                className={`text-[11px] font-medium truncate transition-colors ${
                  isActive
                    ? 'text-[#7C4DFF]'
                    : 'text-[#AAAAAA] dark:text-[#555555]'
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
