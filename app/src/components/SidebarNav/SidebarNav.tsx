import { NavLink, useLocation } from 'react-router-dom'
import { HomeIcon, HighlightsIcon, InsightsIcon, SearchIcon, SettingsIcon } from '../icons/Icons'
import { useAuthStore } from '../../store/auth'
import { useSyncStore } from '../../store/sync'
import { DANGER, PENDING, SUCCESS } from '../../lib/theme'

// Desktop-only (docs/14 §Navigation: Sidebar). Renders instead of BottomNav
// at the `lg` breakpoint via `hidden lg:flex` / `lg:hidden` — both live in
// the DOM simultaneously, same pattern already used for dark:/light:
// swapping elsewhere in the app, so there's no JS breakpoint detection and
// no remount flash when the window crosses 1024px.

const NAV_ITEMS = [
  { path: '/',           label: 'Home',       Icon: HomeIcon },
  { path: '/highlights', label: 'Highlights', Icon: HighlightsIcon },
  { path: '/insights',   label: 'Insights',   Icon: InsightsIcon },
  { path: '/search',     label: 'Search',     Icon: SearchIcon },
  { path: '/settings',   label: 'Settings',   Icon: SettingsIcon },
]

const ACTIVE = 'var(--color-terracotta)'
const INACTIVE = 'var(--color-hint)'

interface SidebarNavProps {
  onCapture: () => void
}

export function SidebarNav({ onCapture }: SidebarNavProps) {
  const location = useLocation()
  const displayName = useAuthStore(s => s.displayName)
  const syncStatus = useSyncStore(s => s.status)

  // Hidden on the same full-attention flows BottomNav hides on (spec §3/§5:
  // Morning/Evening "deserve full attention" — holds on desktop too).
  const HIDE_ON = ['/morning', '/evening', '/onboarding']
  if (HIDE_ON.some(p => location.pathname.startsWith(p))) return null

  const syncColor = syncStatus === 'error' ? DANGER : syncStatus === 'syncing' ? PENDING : SUCCESS
  const syncLabel = syncStatus === 'error' ? 'sync error' : syncStatus === 'syncing' ? 'syncing…' : 'synced'

  return (
    <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 w-60 flex-col border-r border-hairline dark:border-hairline-dark bg-surface dark:bg-surface-dark">
      <div className="px-5 pt-6 pb-4">
        <p className="font-display text-[19px] font-bold text-ink dark:text-ink-dark">✦ Mosaic</p>
      </div>

      <div className="px-4 mb-4">
        <button
          onClick={onCapture}
          className="w-full py-2.5 rounded-btn bg-terracotta font-display font-semibold text-[14px] active:scale-[0.98] transition-transform"
          style={{ color: '#3D1F12', boxShadow: 'inset 0 -2px 0 rgba(43,36,32,0.15), 0 1px 3px rgba(43,36,32,0.12)' }}
        >
          + New moment
        </button>
      </div>

      <div className="flex-1 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path)
          return (
            <NavLink
              key={path}
              to={path}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-btn-sm hover:bg-elevated dark:hover:bg-elevated-dark transition-colors"
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-terracotta" />
              )}
              <Icon size={20} color={isActive ? ACTIVE : INACTIVE} />
              <span
                className={`text-[14px] truncate ${
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

      <div className="px-5 py-4 border-t border-hairline dark:border-hairline-dark flex items-center gap-2">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: syncColor }} />
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink dark:text-ink-dark truncate">{displayName || 'Mosaic'}</p>
          <p className="text-[11px] text-hint dark:text-hint-dark">{syncLabel}</p>
        </div>
      </div>
    </nav>
  )
}
