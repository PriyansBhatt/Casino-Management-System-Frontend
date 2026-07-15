import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import IconButton from '../ui/IconButton'
import { cn } from '../../utils/cn'
import NotificationBell from '../notifications/NotificationBell'

const Topbar = ({ isDesktopCollapsed = false, onMenuClick }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur transition-all duration-300',
        isDesktopCollapsed ? 'lg:left-20' : 'lg:left-72'
      )}
    >
      <div className="flex h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-7">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <IconButton
            label="Open menu"
            onClick={onMenuClick}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            ☰
          </IconButton>

          <div className="hidden h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 lg:flex">
            ⫶
          </div>

          <div className="relative max-w-3xl flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search badge #, customer ID, vendor, voucher..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-500 focus:bg-white focus:ring-2 focus:ring-yellow-500/20"
            />
          </div>

          <div className="hidden rounded-lg border border-yellow-400 bg-yellow-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-yellow-700 xl:block">
            Shift · Day 13:00–23:00
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <NotificationBell />

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-yellow-300 bg-yellow-100 text-sm font-bold text-yellow-700">
              {(user?.fullName || user?.name || 'DA')
                .split(' ')
                .map((word) => word[0])
                .join('')
                .slice(0, 2)}
            </div>

            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">
                {user?.fullName || user?.name || 'Director Admin'}
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">
                {user?.role || 'DIRECTOR / OWNER'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Topbar