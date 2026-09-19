import AccountsBills from '../pages/accounts/AccountsBills'
import { Navigate, Route, Routes } from 'react-router-dom'

// ============================================================
// AUTHENTICATION
// ============================================================

import Login from '../pages/auth/Login'

// ============================================================
// SHARED PAGES
// ============================================================

import Dashboard from '../pages/Dashboard'
import ComingSoon from '../pages/ComingSoon'
import NotFound from '../pages/NotFound'
import Unauthorized from '../pages/Unauthorized'
import StaffAttendance from '../pages/attendance/StaffAttendance'
import StaffManagement from '../pages/hr/StaffManagement'
import ShiftRosterManagement from '../pages/hr/ShiftRosterManagement'
import AttendanceManagement from '../pages/hr/AttendanceManagement'
import MyLeave from '../pages/hr/MyLeave'
import LeaveManagement from '../pages/hr/LeaveManagement'

// ============================================================
// ROUTE GUARDS
// ============================================================

import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'

// ============================================================
// GLOBAL LAYOUT
// ============================================================

import MainLayout from '../components/layout/MainLayout'
import TestScope from '../components/layout/TestScope'
import { authoritativeTestMode } from '../utils/testEnvironment'

// ============================================================
// RECEPTION / CUSTOMERS
// ============================================================

import CustomerSearch from '../pages/reception/CustomerSearch'
import CustomersKyc from '../pages/reception/CustomersKyc'

// ============================================================
// CASHIER / CASH & CHIPS
// ============================================================

import BuyIn from '../pages/cashier/BuyIn'
import CashOut from '../pages/cashier/CashOut'
import CashierReconciliation from '../pages/cashier/CashierReconciliation'
import WalletTransactions from '../pages/cashier/WalletTransactions'

// Detailed Cash-Out and Losing Return page
import LosingReturnPreview from '../pages/reports/LosingReturnPreview'

// ============================================================
// GAMING FLOOR / PIT
// ============================================================

import TableList from '../pages/pit/TableList'
import TableSessionDetails from '../pages/pit/TableSessionDetails'
import DealerTableMode from '../pages/pit/DealerTableMode'
import SlotMachineGaming from '../pages/pit/SlotMachineGaming'

// ============================================================
// CRM / GRE
// ============================================================

import CrmGreMarketing from '../pages/crm/CrmGreMarketing'

// ============================================================
// F&B / KITCHEN / BAR
// ============================================================

import FnbKitchenBar from '../pages/fnb/FnbKitchenBar'

// ============================================================
// STORE
// ============================================================

import StorePurchaseDashboard from '../pages/store/StorePurchaseDashboard'

// ============================================================
// PROCUREMENT
// ============================================================


// ============================================================
// ACCOUNTS
// ============================================================


// ============================================================
// AUDIT / ANALYTICS
// ============================================================

import AuditLogs from '../pages/audit/AuditLogs'
import ManagementAnalytics from '../pages/analytics/ManagementAnalytics'
import RunningFundsReport from '../pages/reports/RunningFundsReport'

// ============================================================
// ADMIN / SETTINGS
// ============================================================

import Users from '../pages/admin/Users'
import Roles from '../pages/admin/Roles'
import Departments from '../pages/admin/Departments'
import BusinessDateSettings from '../pages/admin/BusinessDateSettings'
import SystemLockSettings from '../pages/admin/SystemLockSettings'
import SystemSettings from '../pages/admin/SystemSettings'
import PermissionOverview from '../pages/admin/PermissionOverview'

// ============================================================
// OTHER SYSTEM PAGES
// ============================================================

import Notifications from '../pages/notifications/Notifications'
import TestChecklist from '../pages/testing/TestChecklist'
import DemoControlPanel from '../pages/demo/DemoControlPanel'

// ============================================================
// PROTECTED PAGE WRAPPER
// ============================================================

const protectedPage = (page) => (
  <ProtectedRoute>
    <MainLayout><TestScope>{page}</TestScope></MainLayout>
  </ProtectedRoute>
)

const protectedFocusedPage = (page) => (
  <ProtectedRoute>{page}</ProtectedRoute>
)

// ============================================================
// ROUTES
// ============================================================

const AppRoutes = () => {
  return (
    <Routes>
      {/* =====================================================
          PUBLIC ROUTES
      ===================================================== */}

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      <Route
        path="/dashboard"
        element={protectedPage(<Dashboard />)}
      />

      <Route
        path="/attendance"
        element={protectedPage(<StaffAttendance />)}
      />

      <Route
        path="/hr/staff"
        element={protectedPage(<StaffManagement />)}
      />

      <Route
        path="/hr/roster"
        element={protectedPage(<ShiftRosterManagement />)}
      />

      <Route
        path="/hr/attendance"
        element={protectedPage(<AttendanceManagement />)}
      />

      <Route
        path="/hr/leave/me"
        element={protectedPage(<MyLeave />)}
      />

      <Route
        path="/hr/leave"
        element={protectedPage(<LeaveManagement />)}
      />

      {/* =====================================================
          RECEPTION / GATE
      ===================================================== */}

      <Route
        path="/reception"
        element={protectedPage(<CustomerSearch />)}
      />

      <Route
        path="/reception/gate"
        element={<Navigate to="/reception" replace />}
      />

      <Route
        path="/reception/register"
        element={<Navigate to="/customers" replace />}
      />

      <Route
        path="/reception/customer/:id"
        element={<Navigate to="/customers" replace />}
      />

      <Route
        path="/reception/customer/:id/edit"
        element={<Navigate to="/customers" replace />}
      />

      {/* =====================================================
    CUSTOMERS & KYC
===================================================== */}

<Route
  path="/customers"
  element={protectedPage(<CustomersKyc />)}
/>

<Route
  path="/customers/kyc"
  element={<Navigate to="/customers" replace />}
/>

<Route
  path="/customers/register"
  element={<Navigate to="/customers" replace />}
/>

<Route
  path="/customers/:id"
  element={<Navigate to="/customers" replace />}
/>

<Route
  path="/customers/:id/edit"
  element={<Navigate to="/customers" replace />}
/>


      {/* =====================================================
          DAILY BADGE & SESSIONS

          No dedicated page file currently exists in the
          folders shown. It remains paused intentionally.
      ===================================================== */}

     <Route
  path="/daily-sessions"
  element={<Navigate to="/customers" replace />}
/>

<Route
  path="/daily-badge-sessions"
  element={<Navigate to="/customers" replace />}
/>

<Route
  path="/badge-sessions"
  element={<Navigate to="/customers" replace />}
/>


      {/* =====================================================
          CASH COLLECTION & BUY-IN
      ===================================================== */}

      <Route
        path="/cashier/buy-in"
        element={protectedPage(<BuyIn />)}
      />

      <Route
        path="/cashier/buyin"
        element={<Navigate to="/cashier/buy-in" replace />}
      />

      <Route
        path="/buy-in"
        element={<Navigate to="/cashier/buy-in" replace />}
      />

      <Route
        path="/cash-collection"
        element={<Navigate to="/cashier/buy-in" replace />}
      />

      {/* =====================================================
          CHIP CONTROL
      ===================================================== */}

      <Route
        path="/chip-control"
        element={protectedPage(<WalletTransactions />)}
      />

      <Route
        path="/cashier/wallet-transactions"
        element={<Navigate to="/chip-control" replace />}
      />

      <Route
        path="/wallet-transactions"
        element={<Navigate to="/chip-control" replace />}
      />

      {/* =====================================================
          CASH-OUT & RETURN CONTROL
      ===================================================== */}

      <Route
        path="/cashier/cash-out"
        element={protectedPage(<CashOut />)}
      />

      <Route
        path="/cashier/basic-cash-out"
        element={protectedPage(<CashOut />)}
      />

      <Route
        path="/cash-out"
        element={<Navigate to="/cashier/cash-out" replace />}
      />

      <Route
        path="/cashout"
        element={<Navigate to="/cashier/cash-out" replace />}
      />

      <Route
        path="/losing-return"
        element={<Navigate to="/cashier/cash-out" replace />}
      />

      <Route
        path="/cash-out-return-control"
        element={<Navigate to="/cashier/cash-out" replace />}
      />

      <Route
        path="/cash-out-losing-return"
        element={<Navigate to="/cashier/cash-out" replace />}
      />

      {/* =====================================================
          CASHIER RECONCILIATION
      ===================================================== */}

      <Route
        path="/cashier/reconciliation"
        element={protectedPage(<CashierReconciliation />)}
      />

      <Route
        path="/cashier-reconciliation"
        element={<Navigate to="/cashier/reconciliation" replace />}
      />

      {/* =====================================================
          GAMING FLOOR / PIT
      ===================================================== */}

      <Route
        path="/pit/tables"
        element={protectedPage(<TableList />)}
      />

      <Route
        path="/gaming-floor"
        element={<Navigate to="/pit/tables" replace />}
      />

      <Route
        path="/gaming-floor-pit"
        element={<Navigate to="/pit/tables" replace />}
      />

      <Route
        path="/pit"
        element={<Navigate to="/pit/tables" replace />}
      />

      <Route
        path="/pit/tables/new"
        element={<Navigate to="/pit/tables" replace />}
      />

      <Route
        path="/pit/tables/:tableId/mode"
        element={protectedFocusedPage(<DealerTableMode />)}
      />

      <Route
        path="/pit/tables/:tableId"
        element={protectedPage(<TableSessionDetails />)}
      />

      <Route
        path="/pit/tables/:tableId/close"
        element={protectedPage(<TableSessionDetails />)}
      />

      <Route path="/pit/open-sessions" element={<Navigate to="/pit/tables" replace />} />
      <Route path="/pit/close-sessions" element={<Navigate to="/pit/tables" replace />} />
      <Route path="/pit/sessions/:id" element={<Navigate to="/pit/tables" replace />} />

      <Route
        path="/pit/table-reports"
        element={<Navigate to="/pit/tables" replace />}
      />

      {/* =====================================================
          SLOT & MACHINE GAMING
      ===================================================== */}

      <Route
        path="/slot-machines"
        element={protectedPage(<SlotMachineGaming />)}
      />

      <Route
        path="/slot-machine-gaming"
        element={<Navigate to="/slot-machines" replace />}
      />

      <Route
        path="/machine-gaming"
        element={<Navigate to="/slot-machines" replace />}
      />

      <Route
        path="/slots"
        element={<Navigate to="/slot-machines" replace />}
      />

      {/* =====================================================
          CRM / GRE / MARKETING
      ===================================================== */}

      <Route
        path="/crm-gre"
        element={protectedPage(<CrmGreMarketing />)}
      />

      <Route
        path="/crm"
        element={<Navigate to="/crm-gre" replace />}
      />

      <Route
        path="/crm-gre-marketing"
        element={<Navigate to="/crm-gre" replace />}
      />

      <Route
        path="/crm-gre/hotel-bookings"
        element={<Navigate to="/crm-gre" replace />}
      />

      <Route
        path="/crm-gre/services"
        element={<Navigate to="/crm-gre" replace />}
      />

      <Route
        path="/crm-gre/vehicles"
        element={<Navigate to="/crm-gre" replace />}
      />

      <Route
        path="/crm-gre/gifts"
        element={<Navigate to="/crm-gre" replace />}
      />

      {/* =====================================================
          F&B / KITCHEN / BAR
      ===================================================== */}

      <Route
        path="/fnb"
        element={protectedPage(<FnbKitchenBar />)}
      />

      <Route
        path="/fnb-kitchen-bar"
        element={<Navigate to="/fnb" replace />}
      />

      <Route
        path="/fnb/dashboard"
        element={<Navigate to="/fnb" replace />}
      />

      <Route
        path="/fnb/new-request"
        element={<Navigate to="/fnb" replace />}
      />

      <Route
        path="/fnb/kitchen-kot"
        element={<Navigate to="/fnb" replace />}
      />

      <Route
        path="/fnb/bar-bot"
        element={<Navigate to="/fnb" replace />}
      />

      <Route
        path="/fnb/manager"
        element={<Navigate to="/fnb" replace />}
      />

      <Route
        path="/fnb/history"
        element={<Navigate to="/fnb" replace />}
      />

      {/* =========================================================
    STORE / PURCHASE
========================================================= */}

<Route path="/store/department-requests" element={<Navigate to="/store/purchase" replace />} />
<Route path="/store/requests/new" element={<Navigate to="/store/purchase" replace />} />
<Route path="/store/review" element={<Navigate to="/store/purchase" replace />} />
<Route path="/store/stock" element={<Navigate to="/store/purchase" replace />} />
<Route path="/store/delivery-receive" element={<Navigate to="/store/purchase" replace />} />
<Route path="/department/confirm-received" element={protectedPage(<section role="status">Deferred / Not available: department self-service is outside Store SP1.</section>)} />
<Route
  path="/store/purchase"
  element={protectedPage(<StorePurchaseDashboard />)}
/>

<Route
  path="/store"
  element={<Navigate to="/store/purchase" replace />}
/>

<Route
  path="/store/dashboard"
  element={<Navigate to="/store/purchase" replace />}
/>


      {/* =====================================================
          PROCUREMENT
      ===================================================== */}

      <Route
        path="/procurement"
        element={<Navigate to="/store/purchase" replace />}
      />

      <Route
        path="/procurement/list"
        element={<Navigate to="/store/purchase" replace />}
      />

      <Route
        path="/procurement/vendor-quotations"
        element={protectedPage(<section role="status" className="rounded border bg-white p-6"><h1>Deferred / Not available</h1><p>Quotations and formal purchase orders are outside Store SP1. No prototype records are loaded or saved.</p></section>)}
      />

      <Route
        path="/procurement/purchase-orders"
        element={protectedPage(<section role="status" className="rounded border bg-white p-6"><h1>Deferred / Not available</h1><p>Quotations and formal purchase orders are outside Store SP1. No prototype records are loaded or saved.</p></section>)}
      />

      {/* =====================================================
          ACCOUNTS
      ===================================================== */}

      <Route path="/accounts" element={protectedPage(<AccountsBills />)} />
      <Route path="/accounts/bills" element={protectedPage(<AccountsBills />)} />
      <Route path="/accounts/*" element={protectedPage(<section><h1>Not available in AC1</h1><p>Payments, cheques, deposits, Day Book, Payables and Finance Reports are deferred.</p></section>)} />

      {/* =====================================================
          REPORTS & ANALYTICS
      ===================================================== */}

      <Route
        path="/reports"
        element={protectedPage(<RunningFundsReport />)}
      />

      <Route
        path="/reports/running-funds"
        element={protectedPage(<RunningFundsReport />)}
      />

      <Route
        path="/analytics/management"
        element={protectedPage(<ManagementAnalytics />)}
      />

      {/* =====================================================
          AUDIT LOGS
      ===================================================== */}

      <Route
        path="/audit-logs"
        element={protectedPage(<AuditLogs />)}
      />

      <Route
        path="/audit-logs/:id"
        element={protectedPage(<Navigate to="/audit-logs" replace />)}
      />

      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      <Route
        path="/notifications"
        element={protectedPage(<Notifications />)}
      />

      {/* =====================================================
          SETTINGS / ADMIN
      ===================================================== */}

      <Route
        path="/settings"
        element={protectedPage(<SystemSettings />)}
      />

      <Route
        path="/admin/users"
        element={protectedPage(<Users />)}
      />

      <Route
        path="/admin/roles"
        element={protectedPage(<Roles />)}
      />

      <Route
        path="/admin/departments"
        element={protectedPage(<Departments />)}
      />

      <Route
        path="/admin/business-date"
        element={protectedPage(<BusinessDateSettings />)}
      />

      <Route
        path="/admin/system-lock"
        element={protectedPage(authoritativeTestMode ? <SystemSettings lockOnly /> : <SystemLockSettings />)}
      />

      <Route
        path="/admin/system-settings"
        element={protectedPage(<SystemSettings />)}
      />

      <Route
        path="/admin/permissions"
        element={protectedPage(<PermissionOverview />)}
      />

      {/* =====================================================
          TESTING / DEMO
      ===================================================== */}

      <Route
        path="/testing/checklist"
        element={protectedPage(<TestChecklist />)}
      />

      <Route
        path="/demo/control-panel"
        element={protectedPage(<DemoControlPanel />)}
      />

      {/* =====================================================
          FALLBACK
      ===================================================== */}

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
