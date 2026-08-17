import axiosInstance from './axiosInstance'
import PIT_MOCK_TABLES from '../constants/pitMockData'
import { TABLE_SESSION_STATUSES, TABLE_STATUSES } from '../constants/pitConstants'
import { calculateTableNet, generateTableSessionReference } from '../utils/pitUtils'

const tablesStorageKey = 'casino_mock_pit_tables'
const sessionsStorageKey = 'casino_mock_pit_sessions'
const isMockPitEnabled = () => import.meta.env.VITE_USE_MOCK_PIT === 'true'
const wait = () => new Promise((resolve) => setTimeout(resolve, 250))

const readStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed = JSON.parse(saved)
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback
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

let mockTables = readStorage(tablesStorageKey, PIT_MOCK_TABLES)
let mockSessions = readStorage(sessionsStorageKey, [])

const saveTables = () => saveStorage(tablesStorageKey, mockTables)
const saveSessions = () => saveStorage(sessionsStorageKey, mockSessions)

export const pitApi = {
  getAuthoritativeTables: async () => {
    const response = await axiosInstance.get('/pit-tables', { skipUnauthorizedRedirect: true })
    return Array.isArray(response.data) ? response.data : []
  },

  getAuthoritativeTable: async (tableId) => {
    const response = await axiosInstance.get(`/pit-tables/${tableId}`, {
      skipUnauthorizedRedirect: true,
    })
    return response.data
  },

  createAuthoritativeTable: async (payload) => {
    const response = await axiosInstance.post('/pit-tables', payload, {
      skipUnauthorizedRedirect: true,
    })
    return response.data
  },

  getAssignedPlayers: async (tableId) => {
    const response = await axiosInstance.get(`/pit/tables/${tableId}/players`, {
      skipUnauthorizedRedirect: true,
    })
    return response.data?.data || []
  },

  getPlayerHistory: async (tableId) => {
    const response = await axiosInstance.get(`/pit/tables/${tableId}/players/history`, {
      skipUnauthorizedRedirect: true,
    })
    return response.data?.data || []
  },

  getTableReconciliation: async (tableId) => {
    const response = await axiosInstance.get(`/pit-tables/${tableId}/reconciliation`, {
      skipUnauthorizedRedirect: true,
    })
    return response.data
  },

  closeAuthoritativeTable: async (tableId, closingFloat) => {
    const response = await axiosInstance.put(`/pit-tables/${tableId}/close`, null, {
      params: { closingFloat },
      skipUnauthorizedRedirect: true,
    })
    return response.data
  },

  assignPlayer: async (tableId, payload) => {
    const response = await axiosInstance.post(`/pit/tables/${tableId}/players`, payload, {
      skipUnauthorizedRedirect: true,
    })
    return response.data?.data
  },

  leavePlayer: async (tableId, assignmentId) => {
    const response = await axiosInstance.post(
      `/pit/tables/${tableId}/players/${assignmentId}/leave`, {},
      { skipUnauthorizedRedirect: true },
    )
    return response.data?.data
  },

  createVerifiedGamingResult: async (payload) => {
    const response = await axiosInstance.post('/verified-gaming-results', payload, {
      skipUnauthorizedRedirect: true,
    })
    return response.data?.data
  },

  getVerifiedGamingResults: async (customerSessionId) => {
    const response = await axiosInstance.get(
      `/verified-gaming-results/session/${customerSessionId}`,
      { skipUnauthorizedRedirect: true },
    )
    return response.data?.data || []
  },
  getTables: async (filters = {}) => {
    if (isMockPitEnabled()) {
      await wait()
      return mockTables.filter((table) => {
        const statusMatches = !filters.status || table.status === filters.status
        const gameTypeMatches = !filters.gameType || table.gameType === filters.gameType
        const normalizedSearch = filters.search?.toLowerCase()
        const searchMatches =
          !normalizedSearch ||
          [table.tableCode, table.tableName].some((value) =>
            value?.toLowerCase().includes(normalizedSearch)
          )
        return statusMatches && gameTypeMatches && searchMatches
      })
    }

    const response = await axiosInstance.get('/pit/tables', { params: filters })
    return response.data
  },

  getTableById: async (id) => {
    if (isMockPitEnabled()) {
      await wait()
      const table = mockTables.find((item) => item.id === String(id))
      if (!table) throw new Error('Table not found')
      return table
    }

    const response = await axiosInstance.get(`/pit/tables/${id}`)
    return response.data
  },

  createTable: async (payload) => {
    if (isMockPitEnabled()) {
      await wait()
      const nextId = Math.max(0, ...mockTables.map((table) => Number(table.id) || 0)) + 1
      const table = {
        id: String(nextId),
        tableCode: payload.tableCode || `TBL-${String(nextId).padStart(3, '0')}`,
        status: TABLE_STATUSES.AVAILABLE,
        ...payload,
      }
      mockTables = [table, ...mockTables]
      saveTables()
      return table
    }

    const response = await axiosInstance.post('/pit/tables', payload)
    return response.data
  },

  updateTable: async (id, payload) => {
    if (isMockPitEnabled()) {
      await wait()
      const table = mockTables.find((item) => item.id === String(id))
      if (!table) throw new Error('Table not found')
      const updatedTable = { ...table, ...payload }
      mockTables = mockTables.map((item) => (item.id === String(id) ? updatedTable : item))
      saveTables()
      return updatedTable
    }

    const response = await axiosInstance.put(`/pit/tables/${id}`, payload)
    return response.data
  },

  getTableSessions: async (filters = {}) => {
    if (isMockPitEnabled()) {
      await wait()
      return mockSessions.filter((session) => {
        const statusMatches = !filters.status || session.status === filters.status
        const businessDateMatches =
          !filters.businessDate || session.businessDate === filters.businessDate
        const tableMatches = !filters.tableId || session.tableId === String(filters.tableId)
        const tableCodeMatches = !filters.tableCode || session.tableCode === filters.tableCode
        return statusMatches && businessDateMatches && tableMatches && tableCodeMatches
      })
    }

    const response = await axiosInstance.get('/pit/table-sessions', { params: filters })
    return response.data
  },

  getTableSessionById: async (id) => {
    if (isMockPitEnabled()) {
      await wait()
      const session = mockSessions.find((item) => item.id === String(id))
      if (!session) throw new Error('Table session not found')
      return session
    }

    const response = await axiosInstance.get(`/pit/table-sessions/${id}`)
    return response.data
  },

  openTableSession: async (payload) => {
    if (isMockPitEnabled()) {
      await wait()
      const table = mockTables.find((item) => item.id === String(payload.tableId))
      if (!table) throw new Error('Table not found')
      const nextId = Math.max(0, ...mockSessions.map((session) => Number(session.id) || 0)) + 1
      const now = new Date().toISOString()
      const session = {
        id: String(nextId),
        reference: payload.reference || generateTableSessionReference(),
        tableId: table.id,
        tableCode: table.tableCode,
        tableName: table.tableName,
        gameType: table.gameType,
        businessDate: payload.businessDate,
        openingAmount: Number(payload.openingAmount) || 0,
        closingAmount: null,
        netAmount: null,
        dealerName: payload.dealerName,
        pitBossName: payload.pitBossName,
        shoeReference: payload.shoeReference || '',
        createdBy: payload.createdBy,
        status: TABLE_SESSION_STATUSES.OPEN,
        remarks: payload.remarks ? [{ text: payload.remarks, createdAt: now }] : [],
        openedAt: now,
        closedAt: null,
      }
      mockSessions = [session, ...mockSessions]
      mockTables = mockTables.map((item) =>
        item.id === table.id ? { ...item, status: TABLE_STATUSES.OPEN } : item
      )
      saveSessions()
      saveTables()
      return session
    }

    const response = await axiosInstance.post('/pit/table-sessions/open', payload)
    return response.data
  },

  closeTableSession: async (id, payload) => {
    if (isMockPitEnabled()) {
      await wait()
      const session = mockSessions.find((item) => item.id === String(id))
      if (!session) throw new Error('Table session not found')
      const now = new Date().toISOString()
      const updatedSession = {
        ...session,
        closingAmount: Number(payload.closingAmount) || 0,
        netAmount: calculateTableNet(session.openingAmount, payload.closingAmount),
        status: payload.status || TABLE_SESSION_STATUSES.CLOSED,
        closedBy: payload.closedBy,
        closedAt: now,
        remarks: payload.closingRemarks || payload.remarks
          ? [
              ...(session.remarks || []),
              {
                text: payload.closingRemarks || payload.remarks,
                createdBy: payload.closedBy,
                createdAt: now,
              },
            ]
          : session.remarks || [],
      }
      mockSessions = mockSessions.map((item) =>
        item.id === String(id) ? updatedSession : item
      )
      mockTables = mockTables.map((item) =>
        item.id === session.tableId ? { ...item, status: TABLE_STATUSES.AVAILABLE } : item
      )
      saveSessions()
      saveTables()
      return updatedSession
    }

    const response = await axiosInstance.put(`/pit/table-sessions/${id}/close`, payload)
    return response.data
  },

  addTableSessionRemark: async (id, payload) => {
    if (isMockPitEnabled()) {
      await wait()
      const session = mockSessions.find((item) => item.id === String(id))
      if (!session) throw new Error('Table session not found')
      const remark = {
        text: payload.remark || payload.text,
        createdBy: payload.createdBy,
        createdAt: new Date().toISOString(),
      }
      const updatedSession = {
        ...session,
        remarks: [...(session.remarks || []), remark],
      }
      mockSessions = mockSessions.map((item) =>
        item.id === String(id) ? updatedSession : item
      )
      saveSessions()
      return updatedSession
    }

    const response = await axiosInstance.post(`/pit/table-sessions/${id}/remarks`, payload)
    return response.data
  },
}

export const getTables = pitApi.getTables
export const getTableById = pitApi.getTableById
export const createTable = pitApi.createTable
export const updateTable = pitApi.updateTable
export const getTableSessions = pitApi.getTableSessions
export const getTableSessionById = pitApi.getTableSessionById
export const openTableSession = pitApi.openTableSession
export const closeTableSession = pitApi.closeTableSession
export const addTableSessionRemark = pitApi.addTableSessionRemark

export default pitApi
