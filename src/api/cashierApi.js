import axiosInstance from './axiosInstance'
import { BUY_IN, CASH, CASH_OUT } from '../constants/transactionTypes'
import {
  calculateNetPosition,
  generateTransactionReference,
} from '../utils/transactionUtils'

const storageKey = 'casino_mock_cashier_transactions'
const isMockCashierEnabled = () => import.meta.env.VITE_USE_MOCK_CASHIER === 'true'
const wait = () => new Promise((resolve) => setTimeout(resolve, 250))

const readTransactions = () => {
  try {
    const savedTransactions = localStorage.getItem(storageKey)
    if (savedTransactions) {
      const parsedTransactions = JSON.parse(savedTransactions)
      return Array.isArray(parsedTransactions) ? parsedTransactions : []
    }
  } catch (error) {
    console.error('Failed to read mock cashier transactions:', error)
  }

  return []
}

const saveTransactions = (transactions) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(transactions))
  } catch (error) {
    console.error('Failed to save mock cashier transactions:', error)
  }
}

let mockTransactions = readTransactions()

const createTransaction = (payload, transactionType) => {
  const now = new Date().toISOString()
  const nextId =
    Math.max(0, ...mockTransactions.map((transaction) => Number(transaction.id) || 0)) + 1
  const prefix = transactionType === BUY_IN ? 'BI' : 'CO'

  const transaction = {
    id: String(nextId),
    reference: payload.reference || generateTransactionReference(prefix),
    customerId: payload.customerId,
    customerCode: payload.customerCode,
    customerName: payload.customerName,
    amount: Number(payload.amount) || 0,
    paymentMethod: payload.paymentMethod || CASH,
    remarks: payload.remarks || '',
    businessDate: payload.businessDate,
    transactionType,
    createdBy: payload.createdBy || 'Mock Cashier',
    createdAt: now,
  }

  mockTransactions = [transaction, ...mockTransactions]
  saveTransactions(mockTransactions)
  return transaction
}

const filterTransactions = (filters = {}) => {
  return mockTransactions.filter((transaction) => {
    const businessDateMatches =
      !filters.businessDate || transaction.businessDate === filters.businessDate
    const typeMatches =
      !filters.transactionType || transaction.transactionType === filters.transactionType
    const customerMatches =
      !filters.customerId || transaction.customerId === String(filters.customerId)
    return businessDateMatches && typeMatches && customerMatches
  })
}

export const cashierApi = {
  createBuyIn: async (payload) => {
    const response = await axiosInstance.post('/buyins', payload)
    return response.data?.data
  },

  getBuyInsBySession: async (sessionId) => {
    const response = await axiosInstance.get(`/buyins/session/${sessionId}`)
    return response.data
  },

  getCurrentBusinessDateBuyIns: async () => {
    const response = await axiosInstance.get('/buyins/current', { skipUnauthorizedRedirect: true })
    return response.data?.data
  },

  createCashOut: async (payload) => {
    const response = await axiosInstance.post('/cashouts', payload, {
      skipUnauthorizedRedirect: true,
    })
    return response.data?.data
  },

  getCashOutsBySession: async (sessionId) => {
    const response = await axiosInstance.get(`/cashouts/session/${sessionId}`, {
      skipUnauthorizedRedirect: true,
    })
    return response.data
  },

  getSessionFinancialPosition: async (sessionId) => {
    const response = await axiosInstance.get(`/session-summary/${sessionId}`, {
      skipUnauthorizedRedirect: true,
    })
    return response.data?.data
  },

  getChipControlSessions: async () => {
    const response = await axiosInstance.get('/chip-control/sessions', {
      skipUnauthorizedRedirect: true,
    })
    return response.data?.data
  },

  getCurrentCashierReconciliation: async () => {
    const response = await axiosInstance.get('/cashier-reconciliation/current', {
      skipUnauthorizedRedirect: true,
    })
    return response.data?.data
  },

  previewCashierReconciliation: async (payload) => {
    const response = await axiosInstance.post('/cashier-reconciliation/preview', payload, {
      skipUnauthorizedRedirect: true,
    })
    return response.data?.data
  },

  submitCashierReconciliation: async (payload) => {
    const response = await axiosInstance.post('/cashier-reconciliation/submit', payload, {
      skipUnauthorizedRedirect: true,
    })
    return response.data?.data
  },

  getSubmittedCashierReconciliations: async () => {
    const response = await axiosInstance.get('/cashier-reconciliation/current/submitted', { skipUnauthorizedRedirect: true })
    return response.data?.data
  },

  reopenCashierReconciliation: async (id, reason) => {
    const response = await axiosInstance.post(`/cashier-reconciliation/${id}/reopen`, { reason }, { skipUnauthorizedRedirect: true })
    return response.data?.data
  },

  getLosingReturnEligibility: async (customerId) => {
    const response = await axiosInstance.get(`/losing-returns/eligibility/customer/${customerId}`, { skipUnauthorizedRedirect: true })
    return response.data?.data
  },

  createLosingReturn: async (payload) => {
    const response = await axiosInstance.post('/losing-returns', payload, { skipUnauthorizedRedirect: true })
    return response.data?.data
  },

  getWalletTransactions: async (filters = {}) => {
    if (isMockCashierEnabled()) {
      await wait()
      return filterTransactions(filters)
    }

    const response = await axiosInstance.get('/wallet-transactions', { params: filters })
    return response.data
  },

  getCustomerWalletTransactions: async (customerId) => {
    if (isMockCashierEnabled()) {
      await wait()
      return mockTransactions.filter(
        (transaction) => transaction.customerId === String(customerId)
      )
    }

    const response = await axiosInstance.get(`/wallet-transactions/customer/${customerId}`)
    return response.data
  },

  getDailyCashierSummary: async (filters = {}) => {
    if (isMockCashierEnabled()) {
      await wait()
      const transactions = filterTransactions(filters)
      const totalBuyIn = transactions
        .filter((transaction) => transaction.transactionType === BUY_IN)
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
      const totalCashOut = transactions
        .filter((transaction) => transaction.transactionType === CASH_OUT)
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)

      return {
        businessDate: filters.businessDate || null,
        totalBuyIn,
        totalCashOut,
        netPosition: calculateNetPosition(totalBuyIn, totalCashOut),
        transactionCount: transactions.length,
        transactions,
      }
    }

    const response = await axiosInstance.get('/cashier/daily-summary', { params: filters })
    return response.data
  },
}

export const createBuyIn = cashierApi.createBuyIn
export const createCashOut = cashierApi.createCashOut
export const getCashOutsBySession = cashierApi.getCashOutsBySession
export const getSessionFinancialPosition = cashierApi.getSessionFinancialPosition
export const getWalletTransactions = cashierApi.getWalletTransactions
export const getCustomerWalletTransactions = cashierApi.getCustomerWalletTransactions
export const getDailyCashierSummary = cashierApi.getDailyCashierSummary

export default cashierApi
