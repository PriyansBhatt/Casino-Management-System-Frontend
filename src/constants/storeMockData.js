import {
  DELIVERY_STATUSES,
  REQUEST_STATUSES,
  REQUEST_TYPES,
  STOCK_STATUSES,
} from './storeConstants'

export const DEPARTMENTS = [
  { id: 'dept-1', name: 'Gaming Floor' },
  { id: 'dept-2', name: 'Reception' },
  { id: 'dept-3', name: 'Food and Beverage' },
  { id: 'dept-4', name: 'Security' },
  { id: 'dept-5', name: 'Housekeeping' },
]

export const VENDORS = [
  { id: 'ven-1', vendorName: 'Everest Casino Supplies', phone: '9800000101' },
  { id: 'ven-2', vendorName: 'Himalayan Office Traders', phone: '9800000102' },
  { id: 'ven-3', vendorName: 'Kathmandu Hospitality Mart', phone: '9800000103' },
]

export const STOCK_ITEMS = [
  {
    id: '1',
    itemCode: 'STK-001',
    itemName: 'Playing Cards',
    category: 'Gaming',
    currentStock: 120,
    minimumStock: 40,
    unit: 'Deck',
    location: 'Store A',
    status: STOCK_STATUSES.IN_STOCK,
    remarks: 'Standard baccarat and blackjack decks.',
  },
  {
    id: '2',
    itemCode: 'STK-002',
    itemName: 'Chip Trays',
    category: 'Gaming',
    currentStock: 12,
    minimumStock: 10,
    unit: 'Piece',
    location: 'Store A',
    status: STOCK_STATUSES.LOW_STOCK,
    remarks: 'Monitor before weekend operations.',
  },
  {
    id: '3',
    itemCode: 'STK-003',
    itemName: 'Receipt Rolls',
    category: 'Cashier',
    currentStock: 85,
    minimumStock: 30,
    unit: 'Roll',
    location: 'Store B',
    status: STOCK_STATUSES.IN_STOCK,
    remarks: 'Used by cashier and reception printers.',
  },
  {
    id: '4',
    itemCode: 'STK-004',
    itemName: 'Security Seals',
    category: 'Security',
    currentStock: 0,
    minimumStock: 25,
    unit: 'Pack',
    location: 'Store B',
    status: STOCK_STATUSES.OUT_OF_STOCK,
    remarks: 'Procurement required.',
  },
  {
    id: '5',
    itemCode: 'STK-005',
    itemName: 'Cleaning Chemical',
    category: 'Housekeeping',
    currentStock: 18,
    minimumStock: 20,
    unit: 'Bottle',
    location: 'Store C',
    status: STOCK_STATUSES.LOW_STOCK,
    remarks: 'Daily floor cleaning item.',
  },
]

export const DEPARTMENT_REQUESTS = [
  {
    id: '1',
    reference: 'REQ-20830304-001',
    departmentName: 'Gaming Floor',
    requestedBy: 'Pit Boss User',
    requestType: REQUEST_TYPES.NORMAL,
    items: [
      { itemCode: 'STK-001', itemName: 'Playing Cards', quantity: 20, unit: 'Deck', estimatedRate: 180 },
    ],
    reason: 'Replace used cards for current Business Date operations.',
    status: REQUEST_STATUSES.PENDING_STORE_REVIEW,
    businessDate: '2083-03-04',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    reference: 'REQ-20830304-002',
    departmentName: 'Security',
    requestedBy: 'Security Supervisor',
    requestType: REQUEST_TYPES.URGENT,
    items: [
      { itemCode: 'STK-004', itemName: 'Security Seals', quantity: 10, unit: 'Pack', estimatedRate: 450 },
    ],
    reason: 'Urgent seal requirement under NPR 5,000 cash limit.',
    status: REQUEST_STATUSES.PROCUREMENT_REQUIRED,
    businessDate: '2083-03-04',
    createdAt: new Date().toISOString(),
  },
]

export const PROCUREMENT_ITEMS = [
  {
    id: '1',
    reference: 'PRC-20830304-001',
    requestId: '2',
    requestReference: 'REQ-20830304-002',
    departmentName: 'Security',
    itemName: 'Security Seals',
    quantity: 10,
    unit: 'Pack',
    status: REQUEST_STATUSES.PROCUREMENT_REQUIRED,
    deliveryStatus: DELIVERY_STATUSES.PENDING,
    businessDate: '2083-03-04',
    createdAt: new Date().toISOString(),
    deliveries: [],
  },
]

export default {
  departments: DEPARTMENTS,
  vendors: VENDORS,
  stockItems: STOCK_ITEMS,
  departmentRequests: DEPARTMENT_REQUESTS,
  procurementItems: PROCUREMENT_ITEMS,
}
