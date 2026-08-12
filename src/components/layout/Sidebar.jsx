import { NavLink } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { canAccessRoute } from '../../utils/accessControl'

const sidebarSections = [
  {
  title: 'OPERATIONS',
  items: [
    { label: 'Dashboard', path: '/dashboard', icon: '▦' },
    { label: 'Reception / Gate', path: '/reception', icon: '🚪' },
    { label: 'Customers & KYC', path: '/customers', icon: '👥' },
  ],
},
  {
    title: 'CASH & CHIPS',
    items: [
      { label: 'Cash Collection & Buy-In', path: '/cashier/buy-in', icon: '💵' },
      { label: 'Chip Control', path: '/chip-control', icon: '🔗' },
      { label: 'Cash-Out & Losing Return', path: '/cashier/cash-out', icon: '↩' },
      { label: 'Cashier Reconciliation', path: '/cashier/reconciliation', icon: '🧾' },
    ],
  },
  {
    title: 'GAMING FLOOR',
    items: [
      { label: 'Gaming Floor / Pit', path: '/pit/tables', icon: '🎲' },
      { label: 'Slot & Machine Gaming', path: '/slot-machines', icon: '🎮' },
    ],
  },
  {
    title: 'GUEST SERVICES',
    items: [
      { label: 'CRM / GRE / Marketing', path: '/crm-gre', icon: '♡' },
      { label: 'F&B / Kitchen / Bar', path: '/fnb', icon: '🍴' },
    ],
  },
  {
    title: 'BACK OFFICE',
    items: [
      { label: 'Store / Purchase', path: '/store/purchase', icon: '📦' },
      { label: 'Accounts', path: '/accounts', icon: '💰' },
      { label: 'Reports', path: '/reports', icon: '📊' },
      { label: 'Settings', path: '/settings', icon: '⚙' },
    ],
  },
]

const Sidebar = () => {
  const { user } = useAuth()
  const visibleSections = sidebarSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessRoute(user, item.path)),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-slate-200 bg-white">
      <div className="flex h-[88px] shrink-0 items-center gap-3 border-b border-slate-200 px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-xl text-slate-950">
          ♛
        </div>

        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.08em] text-yellow-600">
            Royal Summit
          </p>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
            Casino ERP
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {visibleSections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="mb-3 px-3 text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">
              {section.title}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
                      isActive
                        ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-300'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    }`
                  }
                >
                  <span className="w-6 text-center">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-200 p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
            Current Role
          </p>
          <p className="mt-1 text-sm font-extrabold text-yellow-700">
            {user?.role || 'NO ROLE'}
          </p>
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
          V0.1 · Prototype Build
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
