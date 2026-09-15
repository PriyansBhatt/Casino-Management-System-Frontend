import { isFnbRoute } from '../../utils/fnb'
import { isCrmRoute } from '../../utils/crm'
import { isMachineRoute } from '../../utils/machines'
import { isPitRoute } from '../../utils/pit'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import Sidebar from './Sidebar'
import { isChipControlRoute } from '../../utils/chipControl'
import { isBuyInRoute } from '../../utils/buyIn'
import { isCustomersRoute } from '../../utils/customersKyc'

const MainLayout = ({ children }) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isManagementDashboard = pathname === '/dashboard'
  const isFnb = isFnbRoute(pathname)
  const isCrm = isCrmRoute(pathname)
  const isPit = isPitRoute(pathname)
  const isMachine = isMachineRoute(pathname)
  const isReconciliation = pathname === '/cashier/reconciliation'
  const isCashOut = pathname === '/cashier/cash-out'
  const isChipControl = isChipControlRoute(pathname)
  const isBuyIn = isBuyInRoute(pathname)
  const isCustomerDirectory = isCustomersRoute(pathname)
  const isReception = pathname === '/reception' || pathname.startsWith('/reception/')
  const { user, logout } = useAuth()

  const displayName = user?.fullName || user?.name || user?.username || 'Authenticated User'
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <div className="min-h-screen pl-[280px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-slate-200 bg-white px-6">
          {isFnb ? <p className="text-sm font-bold text-slate-600">F&B / Kitchen / Bar</p> : isCrm ? <p className="text-sm font-bold text-slate-600">CRM / GRE</p> : isManagementDashboard || isBuyIn ? (
            <p className="text-sm font-bold text-slate-600">{isBuyIn ? 'Cash Collection & Buy-In' : 'Management overview'}</p>
          ) : isChipControl ? <p className="text-sm font-bold text-slate-600">Chip Control</p> : isCashOut ? <p className="text-sm font-bold text-slate-600">Cash-Out &amp; Losing Return</p> : isPit ? <p className="text-sm font-bold text-slate-600">Gaming Floor / Pit</p> : isMachine ? <p className="text-sm font-bold text-slate-600">Slot &amp; Machine Gaming</p> : isReconciliation ? <p className="text-sm font-bold text-slate-600">Cashier Reconciliation</p> : <>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500"
          >
            ⋮
          </button>

          <div className="flex max-w-xl flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
            <span className="text-slate-400">⌕</span>
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder="Search badge #, customer ID, vendor, voucher..."
            />
          </div>

          {!isReception && !isCustomerDirectory && <div className="hidden rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-extrabold text-yellow-700 lg:block">
            SHIFT · Day 13:00–23:00
          </div>}

          </>}

          <div className="ml-auto flex items-center gap-3">
            {!isFnb && !isCrm && !isMachine && !isPit && !isReconciliation && !isCashOut && !isChipControl && !isManagementDashboard && !isBuyIn && !isReception && !isCustomerDirectory && <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"
            >
              🔔
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                2
              </span>
            </button>}

            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-yellow-300 bg-yellow-50 text-sm font-extrabold text-yellow-700">
              {initials || 'AU'}
            </div>

            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-extrabold text-slate-950">
                {displayName}
              </p>
              <p className="text-xs font-bold uppercase text-yellow-700">
                {user?.role || 'NO ROLE'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="p-6">
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
