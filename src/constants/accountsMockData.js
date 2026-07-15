import {
  BILL_STATUSES,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from './accountsConstants'

export const MOCK_BILLS = [
  {
    id: '1',
    billReference: 'BILL-20830304-001',
    vendorName: 'Everest Casino Supplies',
    vendorContact: '9800000101',
    sourceModule: 'PROCUREMENT',
    sourceReference: 'PRC-20830304-001',
    billNumber: 'ECS-1001',
    billAmount: 4500,
    paidAmount: 0,
    remainingAmount: 4500,
    status: BILL_STATUSES.PENDING,
    businessDate: '2083-03-04',
    billDate: '2083-03-04',
    dueDate: '2083-03-11',
    remarks: 'Mock procurement bill awaiting verification.',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    billReference: 'BILL-20830304-002',
    vendorName: 'Himalayan Office Traders',
    vendorContact: '9800000102',
    sourceModule: 'STORE',
    sourceReference: 'STORE-PURCHASE-001',
    billNumber: 'HOT-2201',
    billAmount: 18000,
    paidAmount: 8000,
    remainingAmount: 10000,
    status: BILL_STATUSES.PARTIALLY_PAID,
    businessDate: '2083-03-04',
    billDate: '2083-03-04',
    dueDate: '2083-03-10',
    remarks: 'Mock store purchase bill.',
    createdAt: new Date().toISOString(),
  },
]

export const MOCK_EXPENSES = [
  {
    id: '1',
    expenseReference: 'EXP-20830304-001',
    category: EXPENSE_CATEGORIES.VEHICLE,
    description: 'Vehicle fuel for guest transport.',
    amount: 6000,
    paymentMethod: PAYMENT_METHODS.CASH,
    businessDate: '2083-03-04',
    expenseDate: '2083-03-04',
    createdBy: 'Accounts User',
    remarks: 'Daily cash expense mock record.',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    expenseReference: 'EXP-20830304-002',
    category: EXPENSE_CATEGORIES.UTILITY,
    description: 'Internet service charge.',
    amount: 12000,
    paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
    businessDate: '2083-03-04',
    expenseDate: '2083-03-04',
    createdBy: 'Accounts User',
    remarks: 'Monthly utility placeholder.',
    createdAt: new Date().toISOString(),
  },
]

export const MOCK_PAYMENTS = [
  {
    id: '1',
    paymentReference: 'PAY-20830304-001',
    billId: '2',
    vendorName: 'Himalayan Office Traders',
    amount: 8000,
    paymentMethod: PAYMENT_METHODS.CASH,
    chequeNumber: '',
    paymentDate: '2083-03-04',
    businessDate: '2083-03-04',
    status: PAYMENT_STATUSES.COMPLETED,
    paidBy: 'Accounts User',
    remarks: 'Mock partial cash payment.',
    createdAt: new Date().toISOString(),
  },
]

export default {
  bills: MOCK_BILLS,
  expenses: MOCK_EXPENSES,
  payments: MOCK_PAYMENTS,
}
