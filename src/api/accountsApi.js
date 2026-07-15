import axiosInstance from './axiosInstance'
import ACCOUNTS_MOCK_DATA from '../constants/accountsMockData'
import {
  BILL_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from '../constants/accountsConstants'
import {
  calculateRemainingAmount,
  generateBillReference,
  generateExpenseReference,
  generatePaymentReference,
} from '../utils/accountsUtils'

const billsStorageKey = 'casino_mock_accounts_bills'
const expensesStorageKey = 'casino_mock_accounts_expenses'
const paymentsStorageKey = 'casino_mock_accounts_payments'
const procurementStorageKey = 'casino_mock_store_procurement_items'
const isMockAccountsEnabled = () => import.meta.env.VITE_USE_MOCK_ACCOUNTS === 'true'
const wait = () => new Promise((resolve) => setTimeout(resolve, 250))

const readStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed = JSON.parse(saved)
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback
    if (fallback && typeof fallback === 'object') {
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback
    }
    return parsed ?? fallback
  } catch (error) {
    console.error(`Failed to read ${key}:`, error)
    return fallback
  }
}

const saveStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Failed to save ${key}:`, error)
  }
}

let mockBills = readStorage(billsStorageKey, ACCOUNTS_MOCK_DATA.bills)
let mockExpenses = readStorage(expensesStorageKey, ACCOUNTS_MOCK_DATA.expenses)
let mockPayments = readStorage(paymentsStorageKey, ACCOUNTS_MOCK_DATA.payments)

const saveBills = () => saveStorage(billsStorageKey, mockBills)
const saveExpenses = () => saveStorage(expensesStorageKey, mockExpenses)
const savePayments = () => saveStorage(paymentsStorageKey, mockPayments)
const nextId = (items) => String(Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1)

const filterByText = (values, search) => {
  const normalizedSearch = search?.toLowerCase()
  return !normalizedSearch || values.some((value) => value?.toLowerCase().includes(normalizedSearch))
}

const syncBillsFromProcurement = () => {
  const procurementItems = readStorage(procurementStorageKey, [])
  const procurementBills = procurementItems.flatMap((item) =>
    (item.deliveries || [])
      .filter((delivery) => delivery.billNumber || delivery.billAmount)
      .map((delivery) => ({
        id: `proc-${item.id}-${delivery.id}`,
        billReference: generateBillReference(),
        vendorName: item.selectedQuotation?.vendorName || 'Procurement Vendor',
        vendorContact: item.selectedQuotation?.vendorContact || '',
        sourceModule: 'PROCUREMENT',
        sourceReference: item.reference,
        billNumber: delivery.billNumber || `DEL-${delivery.id}`,
        billAmount: Number(delivery.billAmount || item.selectedQuotation?.quotedAmount || 0),
        paidAmount: 0,
        remainingAmount: Number(delivery.billAmount || item.selectedQuotation?.quotedAmount || 0),
        status: BILL_STATUSES.PENDING,
        businessDate: item.businessDate,
        billDate: delivery.receivedAt?.slice(0, 10) || item.businessDate,
        dueDate: '',
        remarks: delivery.remarks || 'Imported from store delivery receive.',
        createdAt: delivery.receivedAt || new Date().toISOString(),
      }))
  )

  const existingKeys = new Set(mockBills.map((bill) => `${bill.sourceReference}-${bill.billNumber}`))
  const newBills = procurementBills.filter(
    (bill) => !existingKeys.has(`${bill.sourceReference}-${bill.billNumber}`)
  )

  if (newBills.length > 0) {
    mockBills = [...newBills, ...mockBills]
    saveBills()
  }
}

const filterBills = (bills, filters = {}) =>
  bills.filter((bill) => {
    const statusMatches = !filters.status || bill.status === filters.status
    const businessDateMatches = !filters.businessDate || bill.businessDate === filters.businessDate
    const vendorMatches =
      !filters.vendor || bill.vendorName?.toLowerCase().includes(filters.vendor.toLowerCase())
    const sourceModuleMatches = !filters.sourceModule || bill.sourceModule === filters.sourceModule
    const searchMatches = filterByText(
      [bill.billReference, bill.vendorName, bill.sourceReference, bill.billNumber],
      filters.search
    )
    return statusMatches && businessDateMatches && vendorMatches && sourceModuleMatches && searchMatches
  })

export const accountsApi = {
  getBills: async (filters = {}) => {
    if (isMockAccountsEnabled()) {
      await wait()
      syncBillsFromProcurement()
      return filterBills(mockBills, filters)
    }

    const response = await axiosInstance.get('/accounts/bills', { params: filters })
    return response.data
  },

  getBillById: async (id) => {
    if (isMockAccountsEnabled()) {
      await wait()
      syncBillsFromProcurement()
      const bill = mockBills.find((item) => item.id === String(id))
      if (!bill) throw new Error('Bill not found')
      return bill
    }

    const response = await axiosInstance.get(`/accounts/bills/${id}`)
    return response.data
  },

  createBill: async (payload) => {
    if (isMockAccountsEnabled()) {
      await wait()
      const billAmount = Number(payload.billAmount || 0)
      const paidAmount = Number(payload.paidAmount || 0)
      const bill = {
        id: nextId(mockBills),
        billReference: payload.billReference || generateBillReference(),
        sourceModule: payload.sourceModule || 'ACCOUNTS',
        paidAmount,
        remainingAmount: calculateRemainingAmount(billAmount, paidAmount),
        status: payload.status || BILL_STATUSES.PENDING,
        createdAt: new Date().toISOString(),
        ...payload,
        billAmount,
      }
      mockBills = [bill, ...mockBills]
      saveBills()
      return bill
    }

    const response = await axiosInstance.post('/accounts/bills', payload)
    return response.data
  },

  updateBillStatus: async (id, payload) => {
    if (isMockAccountsEnabled()) {
      await wait()
      const bill = mockBills.find((item) => item.id === String(id))
      if (!bill) throw new Error('Bill not found')
      const updated = {
        ...bill,
        ...payload,
        updatedAt: new Date().toISOString(),
      }
      mockBills = mockBills.map((item) => (item.id === String(id) ? updated : item))
      saveBills()
      return updated
    }

    const response = await axiosInstance.put(`/accounts/bills/${id}/status`, payload)
    return response.data
  },

  getExpenses: async (filters = {}) => {
    if (isMockAccountsEnabled()) {
      await wait()
      return mockExpenses.filter((expense) => {
        const categoryMatches = !filters.category || expense.category === filters.category
        const methodMatches = !filters.paymentMethod || expense.paymentMethod === filters.paymentMethod
        const businessDateMatches = !filters.businessDate || expense.businessDate === filters.businessDate
        const searchMatches = filterByText(
          [expense.expenseReference, expense.description, expense.createdBy],
          filters.search
        )
        return categoryMatches && methodMatches && businessDateMatches && searchMatches
      })
    }

    const response = await axiosInstance.get('/accounts/expenses', { params: filters })
    return response.data
  },

  createExpense: async (payload) => {
    if (isMockAccountsEnabled()) {
      await wait()
      const expense = {
        id: nextId(mockExpenses),
        expenseReference: payload.expenseReference || generateExpenseReference(),
        createdAt: new Date().toISOString(),
        ...payload,
        amount: Number(payload.amount || 0),
      }
      mockExpenses = [expense, ...mockExpenses]
      saveExpenses()
      return expense
    }

    const response = await axiosInstance.post('/accounts/expenses', payload)
    return response.data
  },

  getPayments: async (filters = {}) => {
    if (isMockAccountsEnabled()) {
      await wait()
      return mockPayments.filter((payment) => {
        const methodMatches = !filters.paymentMethod || payment.paymentMethod === filters.paymentMethod
        const statusMatches = !filters.status || payment.status === filters.status
        const businessDateMatches = !filters.businessDate || payment.businessDate === filters.businessDate
        const vendorMatches =
          !filters.vendor || payment.vendorName?.toLowerCase().includes(filters.vendor.toLowerCase())
        return methodMatches && statusMatches && businessDateMatches && vendorMatches
      })
    }

    const response = await axiosInstance.get('/accounts/payments', { params: filters })
    return response.data
  },

  createPayment: async (payload) => {
    if (isMockAccountsEnabled()) {
      await wait()
      const payment = {
        id: nextId(mockPayments),
        paymentReference: payload.paymentReference || generatePaymentReference(),
        status: payload.status || PAYMENT_STATUSES.COMPLETED,
        createdAt: new Date().toISOString(),
        ...payload,
        amount: Number(payload.amount || 0),
      }
      mockPayments = [payment, ...mockPayments]

      if (payload.billId) {
        const linkedBill = mockBills.find((bill) => bill.id === String(payload.billId))
        if (linkedBill && payment.amount > Number(linkedBill.remainingAmount || 0)) {
          throw new Error('Payment cannot exceed bill remaining amount.')
        }
        mockBills = mockBills.map((bill) => {
          if (bill.id !== String(payload.billId)) return bill
          const paidAmount = Number(bill.paidAmount || 0) + payment.amount
          const remainingAmount = calculateRemainingAmount(bill.billAmount, paidAmount)
          return {
            ...bill,
            paidAmount,
            remainingAmount,
            status: remainingAmount <= 0 ? BILL_STATUSES.PAID : BILL_STATUSES.PARTIALLY_PAID,
          }
        })
        saveBills()
      }

      savePayments()
      return payment
    }

    const response = await axiosInstance.post('/accounts/payments', payload)
    return response.data
  },

  getVendorPaymentHistory: async (filters = {}) => {
    if (isMockAccountsEnabled()) {
      await wait()
      return mockPayments.filter((payment) => {
        const vendorMatches =
          !filters.vendor || payment.vendorName?.toLowerCase().includes(filters.vendor.toLowerCase())
        const businessDateMatches = !filters.businessDate || payment.businessDate === filters.businessDate
        const methodMatches = !filters.paymentMethod || payment.paymentMethod === filters.paymentMethod
        const statusMatches = !filters.status || payment.status === filters.status
        return vendorMatches && businessDateMatches && methodMatches && statusMatches
      })
    }

    const response = await axiosInstance.get('/accounts/vendor-payment-history', { params: filters })
    return response.data
  },

  getAccountsSummary: async (filters = {}) => {
    if (isMockAccountsEnabled()) {
      await wait()
      syncBillsFromProcurement()
      const bills = filterBills(mockBills, filters)
      const expenses = await accountsApi.getExpenses(filters)
      const payments = await accountsApi.getPayments(filters)
      const pendingBills = bills.filter((bill) => bill.status === BILL_STATUSES.PENDING)
      const completedPayments = payments.filter((payment) => payment.status === PAYMENT_STATUSES.COMPLETED)

      return {
        businessDate: filters.businessDate || 'All',
        totalBills: bills.length,
        pendingBills: pendingBills.length,
        totalBillAmount: bills.reduce((sum, bill) => sum + Number(bill.billAmount || 0), 0),
        totalExpenses: expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
        totalPayments: completedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
        cashPayments: completedPayments
          .filter((payment) => payment.paymentMethod === PAYMENT_METHODS.CASH)
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
        chequePayments: completedPayments
          .filter((payment) => payment.paymentMethod === PAYMENT_METHODS.CHEQUE)
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      }
    }

    const response = await axiosInstance.get('/accounts/summary', { params: filters })
    return response.data
  },
}

export const getBills = accountsApi.getBills
export const getBillById = accountsApi.getBillById
export const createBill = accountsApi.createBill
export const updateBillStatus = accountsApi.updateBillStatus
export const getExpenses = accountsApi.getExpenses
export const createExpense = accountsApi.createExpense
export const getPayments = accountsApi.getPayments
export const createPayment = accountsApi.createPayment
export const getVendorPaymentHistory = accountsApi.getVendorPaymentHistory
export const getAccountsSummary = accountsApi.getAccountsSummary

export default accountsApi
