export const UNAVAILABLE = 'Unavailable'
export const canManageCustomers = (role) => ['DIRECTOR', 'SUPER_ADMIN'].includes(role)
export const isCustomersRoute = (path) => path === '/customers' || path.startsWith('/customers/')

export const lastVisitLabel = (visits, date) => visits === 0 ? 'No visits'
  : typeof date === 'string' && date.trim() ? date : 'Historical date unavailable'

export function mapCustomerDirectory(data) {
  if (!Array.isArray(data)) throw new Error('Customer directory is unavailable: invalid response.')
  return data.map((customer) => {
    if (!customer?.id || !customer.customerCode || typeof customer.fullName !== 'string'
        || !customer.fullName.trim() || typeof customer.totalVisits !== 'number'
        || !Number.isSafeInteger(customer.totalVisits) || customer.totalVisits < 0
        || typeof customer.hasActiveSession !== 'boolean') {
      throw new Error('Customer directory is unavailable: incomplete customer data.')
    }
    return {
      id: customer.id, cid: customer.customerCode, name: customer.fullName,
      initials: customer.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0].toUpperCase()).join(''),
      nationality: customer.nationality, contact: customer.phone, status: customer.status,
      visits: customer.totalVisits,
      lastVisit: lastVisitLabel(customer.totalVisits, customer.lastVisitBusinessDate),
      hasActiveSession: customer.hasActiveSession, activeSessionId: customer.activeSessionId,
      idType: UNAVAILABLE, idNumber: UNAVAILABLE, category: UNAVAILABLE,
    }
  })
}

export function directorySummary(customers, available) {
  return {
    totalCustomers: available ? customers.length : UNAVAILABLE,
    totalVisits: available ? customers.reduce((total, customer) => total + customer.visits, 0) : UNAVAILABLE,
    vipCustomers: UNAVAILABLE, totalBuyIn: UNAVAILABLE, totalCashOut: UNAVAILABLE,
  }
}

export function filterCustomerDirectory(customers, search, nationality) {
  const query = search.trim().toLowerCase()
  return customers.filter((customer) =>
    (nationality === 'ALL' || customer.nationality === nationality)
    && (!query || [customer.name, customer.cid, customer.contact, customer.nationality]
      .some((value) => typeof value === 'string' && value.toLowerCase().includes(query))))
}

export function csvCell(value) {
  let text = String(value ?? '')
  if (/^[\s\uFEFF]*[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

// Only the directory's reception-safe fields are exported, never profile/classification objects.
export function customerDirectoryCsv(customers) {
  return [
    ['CID', 'Customer', 'Nationality', 'Contact', 'Lifetime visits', 'Last visit Business Date', 'Currently inside'],
    ...customers.map((customer) => [customer.cid, customer.name, customer.nationality,
      customer.contact, customer.visits, customer.lastVisit, customer.hasActiveSession ? 'Yes' : 'No']),
  ].map((row) => row.map(csvCell).join(',')).join('\n')
}

export function createCustomerRequestGuard() {
  let version = 0
  return {
    next() { const request = ++version; return () => request === version },
    invalidate() { version += 1 },
  }
}

export async function fetchCustomerProfile(api, customerId, privileged) {
  const [basic, management] = await Promise.all([
    api.getCustomerKyc(customerId),
    privileged ? api.getPrivilegedCustomerKyc(customerId) : Promise.resolve(null),
  ])
  if (basic?.id !== customerId || (privileged && management?.id !== customerId)) {
    throw new Error('Customer profile does not match the selected customer.')
  }
  if (privileged && !Array.isArray(management.identityDocuments)) {
    throw new Error('Customer identity history is unavailable.')
  }
  return { basic, management, documents: management?.identityDocuments || [] }
}
