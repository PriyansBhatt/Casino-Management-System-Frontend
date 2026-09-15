import axiosInstance from './axiosInstance'
import chipCustodyApi from './chipCustodyApi'
import { assertSnapshot } from '../utils/pit'
const envelope = response => { if(response.data?.success !== true || !Object.hasOwn(response.data,'data')) throw new Error('Authoritative Pit response unavailable.'); return required(response.data.data) }
const required = value => { if (value == null) throw new Error('Authoritative Pit response unavailable.'); return value }
const list = value => { if (!Array.isArray(value)) throw new Error('Authoritative Pit list unavailable.'); return value }
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
  getCurrentOpenBusinessDate: chipCustodyApi.getCurrentOpenBusinessDate,
  getOperationalStatus: chipCustodyApi.getOperationalStatus,
  getAuthoritativeTables: async () => {
    const response = await axiosInstance.get('/pit-tables', { skipUnauthorizedRedirect: true })
    return list(response.data)
  },

  getAuthoritativeTable: async (tableId) => {
    const response = await axiosInstance.get(`/pit-tables/${tableId}`, {
      skipUnauthorizedRedirect: true,
    })
    return required(response.data)
  },

  getPitTableMode: async (operationId) => {
    const response = await axiosInstance.get(`/pit-tables/${operationId}/mode`, {
      skipUnauthorizedRedirect: true,
    })
    return assertSnapshot(envelope(response), operationId)
  },

  getEligiblePitTablePlayers: async (operationId, query) => {
    const response = await axiosInstance.get(
      `/pit-tables/${operationId}/eligible-players`,
      { params: { query }, skipUnauthorizedRedirect: true },
    )
    return list(envelope(response))
  },

  openAuthoritativeTable: async (physicalTableId, payload) => {
    const response = await axiosInstance.post(`/pit-tables/physical/${physicalTableId}/open`, payload, {
      skipUnauthorizedRedirect: true,
    })
    return required(response.data)
  },

  getAssignedPlayers: async (tableId) => {
    const response = await axiosInstance.get(`/pit/tables/${tableId}/players`, {
      skipUnauthorizedRedirect: true,
    })
    return list(envelope(response))
  },

  getPlayerHistory: async (tableId) => {
    const response = await axiosInstance.get(`/pit/tables/${tableId}/players/history`, {
      skipUnauthorizedRedirect: true,
    })
    return list(envelope(response))
  },

  getTableReconciliation: async (tableId) => {
    const response = await axiosInstance.get(`/pit-tables/${tableId}/reconciliation`, {
      skipUnauthorizedRedirect: true,
    })
    return required(response.data)
  },

  getPitStaffCandidates: async (role) => {
    const response = await axiosInstance.get('/pit-tables/staff/candidates', {
      params: { role },
      skipUnauthorizedRedirect: true,
    })
    return list(envelope(response))
  },

  getActiveTableStaff: async (tableId) => {
    const response = await axiosInstance.get(`/pit-tables/${tableId}/staff`, {
      skipUnauthorizedRedirect: true,
    })
    return list(envelope(response))
  },

  getTableStaffHistory: async (tableId) => {
    const response = await axiosInstance.get(`/pit-tables/${tableId}/staff/history`, {
      skipUnauthorizedRedirect: true,
    })
    return list(envelope(response))
  },

  assignTableStaff: async (tableId, payload) => {
    const response = await axiosInstance.post(`/pit-tables/${tableId}/staff`, payload, {
      skipUnauthorizedRedirect: true,
    })
    return envelope(response)
  },

  endTableStaffAssignment: async (tableId, assignmentId, payload) => {
    const response = await axiosInstance.post(
      `/pit-tables/${tableId}/staff/${assignmentId}/end`, payload,
      { skipUnauthorizedRedirect: true },
    )
    return envelope(response)
  },

  handoverTableStaff: async (tableId, assignmentRole, payload) => {
    const response = await axiosInstance.post(
      `/pit-tables/${tableId}/staff/${assignmentRole}/handover`, payload,
      { skipUnauthorizedRedirect: true },
    )
    return envelope(response)
  },

  closeAuthoritativeTable: async (tableId, closingFloat) => {
    const response = await axiosInstance.put(`/pit-tables/${tableId}/close`, null, {
      params: { closingFloat },
      skipUnauthorizedRedirect: true,
    })
    return required(response.data)
  },

  assignPlayer: async (tableId, payload) => {
    const response = await axiosInstance.post(`/pit/tables/${tableId}/players`, payload, {
      skipUnauthorizedRedirect: true,
    })
    return envelope(response)
  },

  leavePlayer: async (tableId, assignmentId, payload) => {
    const response = await axiosInstance.post(
      `/pit/tables/${tableId}/players/${assignmentId}/leave`, payload,
      { skipUnauthorizedRedirect: true },
    )
    return envelope(response)
  },

  createVerifiedGamingResult: async (payload) => {
    const response = await axiosInstance.post('/verified-gaming-results', payload, {
      skipUnauthorizedRedirect: true,
    })
    return envelope(response)
  },

  getVerifiedGamingResults: async (customerSessionId) => {
    const response = await axiosInstance.get(
      `/verified-gaming-results/session/${customerSessionId}`,
      { skipUnauthorizedRedirect: true },
    )
    return list(envelope(response))
  },

  executePitMutation: async (op) => {
    const p=op.payload
    let value
    switch(op.kind) {
      case 'open': value=await pitApi.openAuthoritativeTable(op.physicalTableId,p); break
      case 'assign': value=await pitApi.assignPlayer(op.tableId,p); break
      case 'leave': value=await pitApi.leavePlayer(op.tableId,op.assignmentId,p); break
      case 'result': value=await pitApi.createVerifiedGamingResult(p); break
      case 'chip-in': value=await chipCustodyApi.moveCustomerChipsToTable(op.tableId,op.sessionId,p); break
      case 'chip-return': value=await chipCustodyApi.returnTableChipsToCustomer(op.tableId,op.sessionId,p); break
      case 'staff-assign': value=await pitApi.assignTableStaff(op.tableId,p); break
      case 'staff-end': value=await pitApi.endTableStaffAssignment(op.tableId,op.assignmentId,p); break
      case 'staff-handover': value=await pitApi.handoverTableStaff(op.tableId,op.role,p); break
      case 'close': value=await pitApi.closeAuthoritativeTable(op.tableId,p.closingFloat); break
      default: throw new Error('Unknown Pit operation.')
    }
    if (!value || !(value.id || value.assignmentId)) throw new Error('Mutation response unconfirmed. Retain original operation reference.')
    if ((op.kind==='close' && (value.id!==op.tableId || value.status!=='CLOSED'))
      || (op.kind==='open' && op.tableCode && value.tableCode!==op.tableCode)
      || (['assign','leave','result','chip-in','chip-return','staff-assign','staff-end','staff-handover'].includes(op.kind) && value.pitTableId!==op.tableId)
      || (['leave','result','chip-in','chip-return'].includes(op.kind) && value.customerSessionId!==op.sessionId)) throw new Error('Mutation target could not be confirmed.')
    if (value.businessDate !== op.date) throw new Error('Mutation Business Date could not be confirmed.')
    return value
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
