import axiosInstance from './axiosInstance'
import CUSTOMER_MOCK_DATA from '../constants/customerMockData'
import { BUY_IN, CASH_OUT } from '../constants/transactionTypes'
import { calculateNetPosition } from '../utils/transactionUtils'

const cashierStorageKey = 'casino_mock_cashier_transactions'
const customerStorageKey = 'casino_mock_customers'
const isMockReportsEnabled = () => import.meta.env.VITE_USE_MOCK_REPORTS === 'true'
const wait = () => new Promise((resolve) => setTimeout(resolve, 250))

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key)
    if (!value) return fallback
    const parsed = JSON.parse(value)
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback
    return parsed ?? fallback
  } catch (error) {
    console.error(`Failed to read ${key}:`, error)
    return fallback
  }
}

const getMockTransactions = () => readStorage(cashierStorageKey, [])
const getMockCustomers = () => readStorage(customerStorageKey, CUSTOMER_MOCK_DATA)

const filterTransactions = (filters = {}) => {
  const transactions = getMockTransactions()
  const normalizedSearch = filters.customerSearch?.toLowerCase()

  return transactions.filter((transaction) => {
    const businessDateMatches =
      !filters.businessDate || transaction.businessDate === filters.businessDate
    const typeMatches =
      !filters.transactionType || transaction.transactionType === filters.transactionType
    const customerMatches =
      !filters.customerId || transaction.customerId === String(filters.customerId)
    const paymentMatches =
      !filters.paymentMethod || transaction.paymentMethod === filters.paymentMethod
    const searchMatches =
      !normalizedSearch ||
      [transaction.customerName, transaction.customerCode].some((value) =>
        value?.toLowerCase().includes(normalizedSearch)
      )

    return businessDateMatches && typeMatches && customerMatches && paymentMatches && searchMatches
  })
}

const summarizeTransactions = (transactions) => {
  const totalBuyIn = transactions
    .filter((transaction) => transaction.transactionType === BUY_IN)
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
  const totalCashOut = transactions
    .filter((transaction) => transaction.transactionType === CASH_OUT)
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)

  return {
    totalBuyIn,
    totalCashOut,
    netPosition: calculateNetPosition(totalBuyIn, totalCashOut),
    transactionCount: transactions.length,
  }
}

export const reportApi = {
  getRunningFundsReport: async (businessDate) => {
    const response = await axiosInstance.get('/reports/running-funds', {
      params: businessDate ? { businessDate } : {},
      skipUnauthorizedRedirect: true,
    })
    return response.data?.data
  },

  getDailyBusinessReport: async (filters = {}) => {
    if (isMockReportsEnabled()) {
      await wait()
      const transactions = filterTransactions(filters)
      return {
        businessDate: filters.businessDate || null,
        ...summarizeTransactions(transactions),
        uniqueCustomers: new Set(transactions.map((transaction) => transaction.customerId)).size,
        transactions,
      }
    }

    const response = await axiosInstance.get('/reports/daily-business', { params: filters })
    return response.data
  },

  getCustomerTransactionReport: async (customerId, filters = {}) => {
    if (isMockReportsEnabled()) {
      await wait()
      const customers = getMockCustomers()
      const customer = customers.find((item) => item.id === String(customerId))
      const transactions = filterTransactions({ ...filters, customerId })

      return {
        customer,
        customerId: String(customerId),
        ...summarizeTransactions(transactions),
        transactions,
      }
    }

    const response = await axiosInstance.get(`/reports/customer/${customerId}/transactions`, {
      params: filters,
    })
    return response.data
  },

  getTransactionReport: async (filters = {}) => {
    if (isMockReportsEnabled()) {
      await wait()
      const transactions = filterTransactions(filters)
      return {
        filters,
        ...summarizeTransactions(transactions),
        transactions,
      }
    }

    const response = await axiosInstance.get('/reports/transactions', { params: filters })
    return response.data
  },

  getLosingReturnPreview: async (filters = {}) => {
    if (isMockReportsEnabled()) {
      await wait()
      const transactions = filterTransactions(filters)
      const customers = getMockCustomers()
      const customerMap = new Map(customers.map((customer) => [String(customer.id), customer]))

      const byCustomer = transactions.reduce((summary, transaction) => {
        const customerId = String(transaction.customerId)
        const current = summary[customerId] || {
          customerId,
          customer: customerMap.get(customerId) || null,
          totalBuyIn: 0,
          totalCashOut: 0,
          netLoss: 0,
          netVerifiedLoss: 0,
        }

        if (transaction.transactionType === BUY_IN) {
          current.totalBuyIn += Number(transaction.amount || 0)
        }

        if (transaction.transactionType === CASH_OUT) {
          current.totalCashOut += Number(transaction.amount || 0)
        }

        current.netLoss = current.totalBuyIn - current.totalCashOut
        current.netVerifiedLoss = Math.max(current.netLoss, 0)
        return { ...summary, [customerId]: current }
      }, {})

      return {
        businessDate: filters.businessDate || null,
        rule: 'Preview only: losing return must be based on net verified customer loss, not gross buy-in or recycled winnings.',
        customers: Object.values(byCustomer),
      }
    }

    const response = await axiosInstance.get('/reports/losing-return-preview', { params: filters })
    return response.data
  },
}

export const getDailyBusinessReport = reportApi.getDailyBusinessReport
export const getRunningFundsReport = reportApi.getRunningFundsReport
export const getCustomerTransactionReport = reportApi.getCustomerTransactionReport
export const getTransactionReport = reportApi.getTransactionReport
export const getLosingReturnPreview = reportApi.getLosingReturnPreview

export default reportApi
