// Keep the Gate view scoped to persisted Business Dates; timestamps do not select rows.
export async function loadReceptionScope(api) {
  const businessDate = await api.getCurrentOpenBusinessDate()
  if (businessDate === null) return { businessDate: null, customers: [], sessions: [] }
  if (businessDate?.status !== 'OPEN' || !/^\d{4}-\d{2}-\d{2}$/.test(businessDate?.businessDate)) {
    throw new Error('Invalid current OPEN Business Date response.')
  }
  const [customers, sessions] = await Promise.all([
    api.getCustomers(),
    api.getSessions(businessDate.businessDate),
  ])
  if (!Array.isArray(customers) || !Array.isArray(sessions)
      || sessions.some((session) => session.businessDate !== businessDate.businessDate)) {
    throw new Error('Invalid Business Date scoped Reception response.')
  }
  return { businessDate, customers, sessions }
}

export const canMutateReception = (role) => ['RECEPTIONIST', 'SUPER_ADMIN'].includes(role)

export const sessionStatusLabel = (status) => ['OPEN', 'CLOSED'].includes(status)
  ? status : `Unknown / legacy (${status || 'missing'})`

// Each channel owns a guard. Invalidating also covers unmount, modal close and query edits.
export function createRequestGuard() {
  let version = 0
  return {
    next() {
      const request = ++version
      return () => request === version
    },
    invalidate() { version += 1 },
  }
}
