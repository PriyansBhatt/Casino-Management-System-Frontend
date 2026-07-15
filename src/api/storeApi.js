import axiosInstance from './axiosInstance'
import STORE_MOCK_DATA from '../constants/storeMockData'
import {
  DELIVERY_STATUSES,
  REQUEST_STATUSES,
  STOCK_STATUSES,
} from '../constants/storeConstants'
import {
  generateProcurementReference,
  generateRequestReference,
  isLowStock,
} from '../utils/storeUtils'

const requestsStorageKey = 'casino_mock_store_department_requests'
const stockStorageKey = 'casino_mock_store_stock_items'
const procurementStorageKey = 'casino_mock_store_procurement_items'
const quotationsStorageKey = 'casino_mock_store_vendor_quotations'
const isMockStoreEnabled = () => import.meta.env.VITE_USE_MOCK_STORE === 'true'
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

let mockRequests = readStorage(requestsStorageKey, STORE_MOCK_DATA.departmentRequests)
let mockStockItems = readStorage(stockStorageKey, STORE_MOCK_DATA.stockItems)
let mockProcurementItems = readStorage(procurementStorageKey, STORE_MOCK_DATA.procurementItems)
let mockQuotations = readStorage(quotationsStorageKey, [])

const saveRequests = () => saveStorage(requestsStorageKey, mockRequests)
const saveStockItems = () => saveStorage(stockStorageKey, mockStockItems)
const saveProcurementItems = () => saveStorage(procurementStorageKey, mockProcurementItems)
const saveQuotations = () => saveStorage(quotationsStorageKey, mockQuotations)

const nextId = (items) => String(Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1)

const updateStockStatus = (item) => {
  const currentStock = Number(item.currentStock || 0)
  if (currentStock <= 0) return { ...item, status: STOCK_STATUSES.OUT_OF_STOCK }
  if (isLowStock(item)) return { ...item, status: STOCK_STATUSES.LOW_STOCK }
  return { ...item, status: STOCK_STATUSES.IN_STOCK }
}

const filterByText = (values, search) => {
  const normalizedSearch = search?.toLowerCase()
  return !normalizedSearch || values.some((value) => value?.toLowerCase().includes(normalizedSearch))
}

export const storeApi = {
  getDepartmentRequests: async (filters = {}) => {
    if (isMockStoreEnabled()) {
      await wait()
      return mockRequests.filter((request) => {
        const statusMatches = !filters.status || request.status === filters.status
        const typeMatches = !filters.requestType || request.requestType === filters.requestType
        const departmentMatches =
          !filters.departmentName ||
          request.departmentName?.toLowerCase().includes(filters.departmentName.toLowerCase())
        const businessDateMatches = !filters.businessDate || request.businessDate === filters.businessDate
        const searchMatches = filterByText(
          [request.reference, request.departmentName, request.requestedBy, request.reason],
          filters.search
        )
        return statusMatches && typeMatches && departmentMatches && businessDateMatches && searchMatches
      })
    }

    const response = await axiosInstance.get('/store/department-requests', { params: filters })
    return response.data
  },

  getDepartmentRequestById: async (id) => {
    if (isMockStoreEnabled()) {
      await wait()
      const request = mockRequests.find((item) => item.id === String(id))
      if (!request) throw new Error('Department request not found')
      return request
    }

    const response = await axiosInstance.get(`/store/department-requests/${id}`)
    return response.data
  },

  createDepartmentRequest: async (payload) => {
    if (isMockStoreEnabled()) {
      await wait()
      const request = {
        id: nextId(mockRequests),
        reference: payload.reference || generateRequestReference(),
        createdAt: new Date().toISOString(),
        ...payload,
        status: REQUEST_STATUSES.PENDING_STORE_REVIEW,
      }
      mockRequests = [request, ...mockRequests]
      saveRequests()
      return request
    }

    const response = await axiosInstance.post('/store/department-requests', payload)
    return response.data
  },

  reviewDepartmentRequest: async (id, payload) => {
    if (isMockStoreEnabled()) {
      await wait()
      const request = mockRequests.find((item) => item.id === String(id))
      if (!request) throw new Error('Department request not found')
      const updated = {
        ...request,
        ...payload,
        reviewedAt: new Date().toISOString(),
      }
      mockRequests = mockRequests.map((item) => (item.id === String(id) ? updated : item))
      saveRequests()
      return updated
    }

    const response = await axiosInstance.post(`/store/department-requests/${id}/review`, payload)
    return response.data
  },

  getStockItems: async (filters = {}) => {
    if (isMockStoreEnabled()) {
      await wait()
      return mockStockItems.filter((item) => {
        const statusMatches = !filters.status || item.status === filters.status
        const categoryMatches = !filters.category || item.category === filters.category
        const searchMatches = filterByText([item.itemCode, item.itemName, item.category], filters.search)
        return statusMatches && categoryMatches && searchMatches
      })
    }

    const response = await axiosInstance.get('/store/stock-items', { params: filters })
    return response.data
  },

  createStockItem: async (payload) => {
    if (isMockStoreEnabled()) {
      await wait()
      const item = updateStockStatus({
        id: nextId(mockStockItems),
        itemCode: payload.itemCode || `STK-${String(mockStockItems.length + 1).padStart(3, '0')}`,
        ...payload,
      })
      mockStockItems = [item, ...mockStockItems]
      saveStockItems()
      return item
    }

    const response = await axiosInstance.post('/store/stock-items', payload)
    return response.data
  },

  updateStockItem: async (id, payload) => {
    if (isMockStoreEnabled()) {
      await wait()
      const item = mockStockItems.find((stockItem) => stockItem.id === String(id))
      if (!item) throw new Error('Stock item not found')
      const updated = updateStockStatus({ ...item, ...payload })
      mockStockItems = mockStockItems.map((stockItem) => (stockItem.id === String(id) ? updated : stockItem))
      saveStockItems()
      return updated
    }

    const response = await axiosInstance.put(`/store/stock-items/${id}`, payload)
    return response.data
  },

  issueStockItem: async (payload) => {
    if (isMockStoreEnabled()) {
      await wait()
      const item = mockStockItems.find((stockItem) => stockItem.id === String(payload.stockItemId))
      if (!item) throw new Error('Stock item not found')
      const quantity = Number(payload.quantity || 0)
      const updatedStock = updateStockStatus({
        ...item,
        currentStock: Math.max(0, Number(item.currentStock || 0) - quantity),
      })
      mockStockItems = mockStockItems.map((stockItem) =>
        stockItem.id === item.id ? updatedStock : stockItem
      )

      if (payload.requestId) {
        mockRequests = mockRequests.map((request) =>
          request.id === String(payload.requestId)
            ? {
                ...request,
                status: REQUEST_STATUSES.STOCK_ISSUED,
                issuedBy: payload.issuedBy,
                issuedAt: new Date().toISOString(),
              }
            : request
        )
        saveRequests()
      }

      saveStockItems()
      return { stockItem: updatedStock, issuedQuantity: quantity }
    }

    const response = await axiosInstance.post('/store/stock-issues', payload)
    return response.data
  },

  getProcurementList: async (filters = {}) => {
    if (isMockStoreEnabled()) {
      await wait()
      return mockProcurementItems.filter((item) => {
        const statusMatches = !filters.status || item.status === filters.status
        const businessDateMatches = !filters.businessDate || item.businessDate === filters.businessDate
        const vendorMatches =
          !filters.vendor ||
          item.selectedQuotation?.vendorName?.toLowerCase().includes(filters.vendor.toLowerCase())
        const searchMatches = filterByText(
          [item.reference, item.requestReference, item.departmentName, item.itemName],
          filters.search
        )
        return statusMatches && businessDateMatches && vendorMatches && searchMatches
      })
    }

    const response = await axiosInstance.get('/procurement/items', { params: filters })
    return response.data
  },

  createProcurementItem: async (payload) => {
    if (isMockStoreEnabled()) {
      await wait()
      const procurementItem = {
        id: nextId(mockProcurementItems),
        reference: payload.reference || generateProcurementReference(),
        status: REQUEST_STATUSES.PROCUREMENT_REQUIRED,
        deliveryStatus: DELIVERY_STATUSES.PENDING,
        deliveries: [],
        createdAt: new Date().toISOString(),
        ...payload,
      }
      mockProcurementItems = [procurementItem, ...mockProcurementItems]
      saveProcurementItems()
      return procurementItem
    }

    const response = await axiosInstance.post('/procurement/items', payload)
    return response.data
  },

  getVendorQuotations: async (procurementId) => {
    if (isMockStoreEnabled()) {
      await wait()
      return mockQuotations.filter((quotation) => quotation.procurementId === String(procurementId))
    }

    const response = await axiosInstance.get(`/procurement/items/${procurementId}/quotations`)
    return response.data
  },

  addVendorQuotation: async (procurementId, payload) => {
    if (isMockStoreEnabled()) {
      await wait()
      const quotation = {
        id: nextId(mockQuotations),
        procurementId: String(procurementId),
        createdAt: new Date().toISOString(),
        ...payload,
      }
      mockQuotations = [quotation, ...mockQuotations]
      saveQuotations()
      return quotation
    }

    const response = await axiosInstance.post(`/procurement/items/${procurementId}/quotations`, payload)
    return response.data
  },

  selectVendorQuotation: async (procurementId, quotationId) => {
    if (isMockStoreEnabled()) {
      await wait()
      const quotation = mockQuotations.find(
        (item) => item.id === String(quotationId) && item.procurementId === String(procurementId)
      )
      if (!quotation) throw new Error('Quotation not found')

      mockQuotations = mockQuotations.map((item) =>
        item.procurementId === String(procurementId)
          ? { ...item, isSelected: item.id === String(quotationId) }
          : item
      )
      mockProcurementItems = mockProcurementItems.map((item) =>
        item.id === String(procurementId)
          ? { ...item, selectedQuotation: { ...quotation, isSelected: true } }
          : item
      )
      saveQuotations()
      saveProcurementItems()
      return { ...quotation, isSelected: true }
    }

    const response = await axiosInstance.post(
      `/procurement/items/${procurementId}/quotations/${quotationId}/select`
    )
    return response.data
  },

  markProcurementOrdered: async (procurementId, payload = {}) => {
    if (isMockStoreEnabled()) {
      await wait()
      const procurementItem = mockProcurementItems.find((item) => item.id === String(procurementId))
      if (!procurementItem) throw new Error('Procurement item not found')
      const updated = {
        ...procurementItem,
        status: REQUEST_STATUSES.ORDERED,
        orderedBy: payload.orderedBy,
        orderedAt: new Date().toISOString(),
      }
      mockProcurementItems = mockProcurementItems.map((item) =>
        item.id === String(procurementId) ? updated : item
      )
      saveProcurementItems()
      return updated
    }

    const response = await axiosInstance.post(`/procurement/items/${procurementId}/order`, payload)
    return response.data
  },

  receiveDelivery: async (procurementId, payload) => {
    if (isMockStoreEnabled()) {
      await wait()
      const procurementItem = mockProcurementItems.find((item) => item.id === String(procurementId))
      if (!procurementItem) throw new Error('Procurement item not found')
      const receivedQuantity = Number(payload.receivedQuantity || payload.quantity || 0)
      const totalReceived = [
        ...(procurementItem.deliveries || []),
        { receivedQuantity },
      ].reduce((sum, delivery) => sum + Number(delivery.receivedQuantity || 0), 0)
      const requestedQuantity = Number(procurementItem.quantity || 0)
      const deliveryStatus =
        payload.deliveryStatus === DELIVERY_STATUSES.FULL ||
        (requestedQuantity > 0 && totalReceived >= requestedQuantity)
          ? DELIVERY_STATUSES.FULL
          : DELIVERY_STATUSES.PARTIAL
      const status =
        deliveryStatus === DELIVERY_STATUSES.FULL
          ? REQUEST_STATUSES.PENDING_DEPARTMENT_CONFIRMATION
          : REQUEST_STATUSES.PARTIALLY_DELIVERED
      const delivery = {
        id: `${procurementItem.id}-${Date.now()}`,
        receivedItems: payload.receivedItems || procurementItem.itemName,
        receivedQuantity,
        receivedBy: payload.receivedBy,
        deliveryStatus,
        billNumber: payload.billNumber || '',
        billAmount: payload.billAmount || '',
        remarks: payload.remarks || '',
        receivedAt: new Date().toISOString(),
      }
      const updated = {
        ...procurementItem,
        status,
        deliveryStatus,
        deliveries: [...(procurementItem.deliveries || []), delivery],
      }
      mockProcurementItems = mockProcurementItems.map((item) =>
        item.id === String(procurementId) ? updated : item
      )
      if (procurementItem.requestId) {
        mockRequests = mockRequests.map((request) =>
          request.id === String(procurementItem.requestId)
            ? {
                ...request,
                status,
                deliveryStatus,
                deliveredAt: deliveryStatus === DELIVERY_STATUSES.FULL ? new Date().toISOString() : request.deliveredAt,
              }
            : request
        )
        saveRequests()
      }
      saveProcurementItems()
      return updated
    }

    const response = await axiosInstance.post(`/procurement/items/${procurementId}/deliveries`, payload)
    return response.data
  },

  confirmDepartmentReceived: async (requestId, payload) => {
    if (isMockStoreEnabled()) {
      await wait()
      const request = mockRequests.find((item) => item.id === String(requestId))
      if (!request) throw new Error('Department request not found')
      const updated = {
        ...request,
        status: REQUEST_STATUSES.CONFIRMED_RECEIVED,
        confirmedBy: payload.confirmedBy,
        confirmationRemarks: payload.remarks || '',
        confirmedAt: new Date().toISOString(),
      }
      mockRequests = mockRequests.map((item) => (item.id === String(requestId) ? updated : item))
      saveRequests()
      return updated
    }

    const response = await axiosInstance.post(`/department/requests/${requestId}/confirm-received`, payload)
    return response.data
  },
}

export const getDepartmentRequests = storeApi.getDepartmentRequests
export const getDepartmentRequestById = storeApi.getDepartmentRequestById
export const createDepartmentRequest = storeApi.createDepartmentRequest
export const reviewDepartmentRequest = storeApi.reviewDepartmentRequest
export const getStockItems = storeApi.getStockItems
export const createStockItem = storeApi.createStockItem
export const updateStockItem = storeApi.updateStockItem
export const issueStockItem = storeApi.issueStockItem
export const getProcurementList = storeApi.getProcurementList
export const createProcurementItem = storeApi.createProcurementItem
export const getVendorQuotations = storeApi.getVendorQuotations
export const addVendorQuotation = storeApi.addVendorQuotation
export const selectVendorQuotation = storeApi.selectVendorQuotation
export const markProcurementOrdered = storeApi.markProcurementOrdered
export const receiveDelivery = storeApi.receiveDelivery
export const confirmDepartmentReceived = storeApi.confirmDepartmentReceived

export default storeApi
