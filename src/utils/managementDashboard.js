const requiredMetrics = [
  'activeCustomers', 'buyInTotal', 'cashOutTotal',
  'losingReturnPaidTotal', 'activeTables', 'cashierVariance',
]

export const isDashboardNumber = (value) => (
  (typeof value === 'number' || (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value))) &&
  Number.isFinite(Number(value))
)

export const validateDashboard = (envelope, requestedDate = '') => {
  const data = envelope?.data
  if (envelope?.success !== true || !data || typeof data !== 'object' ||
      !data.summary || typeof data.summary !== 'object' || Array.isArray(data.summary) ||
      typeof data.businessDateStatus !== 'string' || data.timeZone !== 'Asia/Kathmandu' ||
      !data.lastUpdated || !Number.isFinite(Date.parse(data.lastUpdated))) {
    throw new Error(envelope?.success !== true && envelope?.message ? envelope.message : 'Invalid dashboard response. Please retry.')
  }
  const noOpenDate = data.businessDate === null && data.businessDateStatus === 'NOT_OPEN'
  if ((!noOpenDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.businessDate || '')) ||
      (requestedDate && data.businessDate !== requestedDate) ||
      (!noOpenDate && (!data.windowStart || !data.windowEndExclusive ||
        !Number.isFinite(Date.parse(data.windowStart)) || !Number.isFinite(Date.parse(data.windowEndExclusive))))) {
    throw new Error('The dashboard returned an invalid Business Date. Please retry.')
  }
  if (requiredMetrics.some((key) => !data.summary[key])) {
    throw new Error('The dashboard response is incomplete. Please retry.')
  }
  for (const metric of Object.values(data.summary)) {
    if (!metric || typeof metric.available !== 'boolean' || typeof metric.description !== 'string' ||
        !metric.description.trim() || (metric.available ? !isDashboardNumber(metric.value) : metric.value !== null) ||
        (noOpenDate && metric.available)) {
      throw new Error('The dashboard returned an invalid metric. Please retry.')
    }
  }
  return data
}

export const formatDashboardMetric = (metric, currency = false) => {
  if (metric?.available !== true || !isDashboardNumber(metric.value)) return 'Not available'
  const number = Number(metric.value).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: currency ? 2 : 0,
  })
  return currency ? `NPR ${number}` : number
}

export const formatDashboardTimestamp = (value) => {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Not available'
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kathmandu', year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(new Date(value))
}
