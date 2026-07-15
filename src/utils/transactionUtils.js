import { ADJUSTMENT, BUY_IN, CASH_OUT } from '../constants/transactionTypes'

export function formatTransactionType(type) {
  switch (type) {
    case BUY_IN:
      return 'Buy-In'
    case CASH_OUT:
      return 'Cash-Out'
    case ADJUSTMENT:
      return 'Adjustment'
    default:
      return type || 'Unknown'
  }
}

export function getTransactionTypeBadgeVariant(type) {
  switch (type) {
    case BUY_IN:
      return 'success'
    case CASH_OUT:
      return 'warning'
    case ADJUSTMENT:
      return 'info'
    default:
      return 'default'
  }
}

export function calculateNetPosition(totalBuyIn = 0, totalCashOut = 0) {
  return Number(totalBuyIn) - Number(totalCashOut)
}

export function generateTransactionReference(prefix) {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}
