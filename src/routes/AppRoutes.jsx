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

// ============================================================
// ROUTE GUARDS
// ============================================================

import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'

// ============================================================
// GLOBAL LAYOUT
// ============================================================

import MainLayout from '../components/layout/MainLayout'

// ============================================================
// RECEPTION / CUSTOMERS
// ============================================================

import CustomerSearch from '../pages/reception/CustomerSearch'
import CustomersKyc from '../pages/reception/CustomersKyc'
import CustomerRegistration from '../pages/reception/CustomerRegistration'

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
import OpenTableSession from '../pages/pit/OpenTableSession'
import CloseTableSession from '../pages/pit/CloseTableSession'
import TableReports from '../pages/pit/TableReports'
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

import CreateDepartmentRequest from '../pages/store/CreateDepartmentRequest'
import DeliveryReceive from '../pages/store/DeliveryReceive'
import DepartmentConfirmation from '../pages/store/DepartmentConfirmation'
import DepartmentRequests from '../pages/store/DepartmentRequests'
import StockManagement from '../pages/store/StockManagement'
import StoreReview from '../pages/store/StoreReview'
import StorePurchaseDashboard from '../pages/store/StorePurchaseDashboard'

// ============================================================
// PROCUREMENT
// ============================================================

import ProcurementList from '../pages/procurement/ProcurementList'
import PurchaseOrders from '../pages/procurement/PurchaseOrders'
import VendorQuotations from '../pages/procurement/VendorQuotations'

// ============================================================
// ACCOUNTS
// ============================================================

import Bills from '../pages/accounts/Bills'
import CashExpenses from '../pages/accounts/CashExpenses'
import ChequePayments from '../pages/accounts/ChequePayments'
import VendorPaymentHistory from '../pages/accounts/VendorPaymentHistory'
import AccountsReports from '../pages/accounts/AccountsReports'

// ============================================================
// AUDIT / ANALYTICS
// ============================================================

import AuditLogs from '../pages/audit/AuditLogs'
import AuditLogDetails from '../pages/audit/AuditLogDetails'
import ManagementAnalytics from '../pages/analytics/ManagementAnalytics'

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
    <MainLayout>{page}</MainLayout>
  </ProtectedRoute>
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
        element={protectedPage(<CustomerRegistration />)}
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
  element={protectedPage(<CustomerRegistration />)}
/>

<Route
  path="/customers/:id"
  element={<Navigate to="/customers" replace />}
/>

<Route
  path="/customers/:id/edit"
  element={<Navigate to="/customers" replace />}
/>


      <Route
        path="/customers"
        element={protectedPage(<CustomerSearch />)}
      />

      <Route
        path="/customers/kyc"
        element={<Navigate to="/customers" replace />}
      />

      <Route
        path="/customers/register"
        element={protectedPage(<CustomerRegistration />)}
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
        element={protectedPage(<OpenTableSession />)}
      />

      <Route
        path="/pit/tables/:tableId"
        element={protectedPage(<TableSessionDetails />)}
      />

      <Route
        path="/pit/tables/:tableId/close"
        element={protectedPage(<CloseTableSession />)}
      />

      <Route
        path="/pit/table-reports"
        element={protectedPage(<TableReports />)}
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
        element={protectedPage(<CrmGreMarketing />)}
      />

      <Route
        path="/crm-gre/services"
        element={protectedPage(<CrmGreMarketing />)}
      />

      <Route
        path="/crm-gre/vehicles"
        element={protectedPage(<CrmGreMarketing />)}
      />

      <Route
        path="/crm-gre/gifts"
        element={protectedPage(<CrmGreMarketing />)}
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
        element={protectedPage(<FnbKitchenBar />)}
      />

      <Route
        path="/fnb/new-request"
        element={protectedPage(<FnbKitchenBar />)}
      />

      <Route
        path="/fnb/kitchen-kot"
        element={protectedPage(<FnbKitchenBar />)}
      />

      <Route
        path="/fnb/bar-bot"
        element={protectedPage(<FnbKitchenBar />)}
      />

      <Route
        path="/fnb/manager"
        element={protectedPage(<FnbKitchenBar />)}
      />

      <Route
        path="/fnb/history"
        element={protectedPage(<FnbKitchenBar />)}
      />

      {/* =========================================================
    STORE / PURCHASE
========================================================= */}

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
        element={protectedPage(<ProcurementList />)}
      />

      <Route
        path="/procurement/list"
        element={protectedPage(<ProcurementList />)}
      />

      <Route
        path="/procurement/vendor-quotations"
        element={protectedPage(<VendorQuotations />)}
      />

      <Route
        path="/procurement/purchase-orders"
        element={protectedPage(<PurchaseOrders />)}
      />

      {/* =====================================================
          ACCOUNTS
      ===================================================== */}

      <Route
        path="/accounts"
        element={protectedPage(<AccountsReports />)}
      />

      <Route
        path="/accounts/dashboard"
        element={<Navigate to="/accounts" replace />}
      />

      <Route
        path="/accounts/bills"
        element={protectedPage(<Bills />)}
      />

      <Route
        path="/accounts/cash-expenses"
        element={protectedPage(<CashExpenses />)}
      />

      <Route
        path="/accounts/cheque-payments"
        element={protectedPage(<ChequePayments />)}
      />

      <Route
        path="/accounts/vendor-payments"
        element={protectedPage(<VendorPaymentHistory />)}
      />

      <Route
        path="/accounts/reports"
        element={protectedPage(<AccountsReports />)}
      />

      {/* =====================================================
          REPORTS & ANALYTICS
      ===================================================== */}

      <Route
        path="/reports"
        element={protectedPage(<ManagementAnalytics />)}
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
        element={protectedPage(<AuditLogDetails />)}
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
        element={protectedPage(<SystemLockSettings />)}
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
