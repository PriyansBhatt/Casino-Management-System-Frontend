export const CASINO_TIME_ZONE = 'Asia/Kathmandu'

const timestampFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: CASINO_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

const businessDateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export const formatAttendanceTimestamp = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : timestampFormatter.format(date)
}

export const formatAttendanceBusinessDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '—'
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return businessDateFormatter.format(date)
}

export const formatWorkedMinutes = (value) => {
  if (value == null) return 'In progress'
  const minutes = Number(value)
  if (!Number.isFinite(minutes) || minutes < 0) return '—'
  const wholeMinutes = Math.floor(minutes)
  const hours = Math.floor(wholeMinutes / 60)
  const remainder = wholeMinutes % 60
  if (hours && remainder) return `${hours}h ${remainder}m`
  if (hours) return `${hours}h`
  return `${remainder}m`
}

export const getCasinoDateSuggestion = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CASINO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

const localInputFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CASINO_TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

export const formatInstantForKathmanduInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = Object.fromEntries(localInputFormatter.formatToParts(date).map(({ type, value: partValue }) => [type, partValue]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export const kathmanduLocalToInstant = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value || '')) return null
  const localWithSeconds = value.length === 16 ? `${value}:00` : value
  const date = new Date(`${localWithSeconds}+05:45`)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}
