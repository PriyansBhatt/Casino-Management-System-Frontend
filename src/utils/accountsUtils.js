import {
  BILL_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from '../constants/accountsConstants'

export function getBillStatusBadgeVariant(status) {
  switch (status) {
    case BILL_STATUSES.VERIFIED:
      return 'info'
    case BILL_STATUSES.PARTIALLY_PAID:
      return 'warning'
    case BILL_STATUSES.PAID:
      return 'success'
    case BILL_STATUSES.REJECTED:
      return 'danger'
    default:
      return 'default'
  }
}

export function getPaymentStatusBadgeVariant(status) {
  switch (status) {
    case PAYMENT_STATUSES.COMPLETED:
      return 'success'
    case PAYMENT_STATUSES.CANCELLED:
      return 'danger'
    case PAYMENT_STATUSES.PENDING:
      return 'warning'
    default:
      return 'default'
  }
}

export function getPaymentMethodBadgeVariant(method) {
  switch (method) {
    case PAYMENT_METHODS.CASH:
      return 'success'
    case PAYMENT_METHODS.CHEQUE:
      return 'warning'
    case PAYMENT_METHODS.BANK_TRANSFER:
      return 'info'
    default:
      return 'default'
  }
}

export function calculateRemainingAmount(billAmount, paidAmount) {
  return Math.max(0, Number(billAmount || 0) - Number(paidAmount || 0))
}

export function generateBillReference() {
  return `BILL-${Date.now().toString().slice(-6)}`
}

export function generateExpenseReference() {
  return `EXP-${Date.now().toString().slice(-6)}`
}

export function generatePaymentReference() {
  return `PAY-${Date.now().toString().slice(-6)}`
}
