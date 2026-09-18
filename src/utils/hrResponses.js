// Validate the existing Java DTO contracts without manufacturing empty results.
const object = v => !!v && typeof v === 'object' && !Array.isArray(v)
const text = v => typeof v === 'string'
const nullableText = v => v === null || text(v)
const id = v => text(v) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
const nullableId = v => v === null || id(v)
const integer = v => Number.isSafeInteger(v) && v >= 0
const nullableInteger = v => v === null || integer(v)
export const hrDate = v => text(v) && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v
const time = v => text(v) && /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,9})?)?$/.test(v)
export const hrTimestamp = (v, instant = false) => {
  if (!text(v)) return false
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?)(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/.exec(v)
  return !!m && hrDate(m[1]) && time(m[2]) && (!instant || !!m[3]) && Number.isFinite(Date.parse(v))
}
// Date.parse truncates Java Instant fractions to milliseconds. Compare at nanosecond precision.
const instantNanos = value => {
  const parts = /^(.*T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/.exec(value)
  return BigInt(Date.parse(parts[1] + parts[3])) * 1000000n + BigInt((parts[2] || '').padEnd(9, '0'))
}
const stamps = (v, keys, instant = false) => keys.every(k => hrTimestamp(v[k], instant))
const optionalStamps = (v, keys, instant = false) => keys.every(k => v[k] === null || hrTimestamp(v[k], instant))
const actor = v => object(v) && id(v.id) && nullableText(v.username) && nullableText(v.fullName)
const staffRef = v => object(v) && id(v.staffProfileId) && id(v.userId) && text(v.employeeCode) && nullableText(v.username) && nullableText(v.fullName)
const named = v => object(v) && id(v.id) && text(v.code) && text(v.name)
const master = v => named(v) && typeof v.active === 'boolean' && nullableText(v.description) && stamps(v,['createdAt','updatedAt'])
const shift = v => master(v) && time(v.startTime) && time(v.endTime) && typeof v.crossesMidnight === 'boolean' && integer(v.lateGraceMinutes) && integer(v.earlyCheckInMinutes)
const staff = v => staffRef(v) && ['ACTIVE','SUSPENDED','INACTIVE','TERMINATED'].includes(v.employmentStatus) && ['FULL_TIME','PART_TIME','CONTRACT','TEMPORARY'].includes(v.employmentType) && (v.dateOfJoining === null || hrDate(v.dateOfJoining)) && (v.department === null || master(v.department)) && (v.jobTitle === null || master(v.jobTitle)) && stamps(v,['createdAt','updatedAt'])
const attendance = v => object(v) && id(v.attendanceId) && actor(v.employee) && hrDate(v.businessDate) && ['OPEN','CLOSED'].includes(v.status) && stamps(v,['checkInAt','createdAt','updatedAt'],true) && optionalStamps(v,['checkOutAt','scheduledStartAt','scheduledEndAt'],true) && nullableInteger(v.workedMinutes) && integer(v.lateByMinutes) && nullableInteger(v.earlyDepartureMinutes) && nullableId(v.rosterAssignmentId) && typeof v.scheduled === 'boolean' && (v.rosterDate === null || hrDate(v.rosterDate)) && ['UNSCHEDULED','ON_TIME','LATE','EARLY_DEPARTURE','LATE_AND_EARLY_DEPARTURE'].includes(v.attendanceScheduleStatus) && (v.status === 'OPEN' ? v.checkOutAt === null && v.workedMinutes === null : v.checkOutAt !== null && v.workedMinutes !== null && instantNanos(v.checkOutAt) > instantNanos(v.checkInAt)) && (!v.scheduled || (id(v.rosterAssignmentId) && hrDate(v.rosterDate) && text(v.shiftCode) && text(v.shiftName) && v.scheduledStartAt !== null && v.scheduledEndAt !== null))
const correction = v => object(v) && id(v.correctionId) && id(v.attendanceId) && ['CHECK_IN_TIME','CHECK_OUT_TIME','CHECK_IN_AND_OUT','MISSED_CHECKOUT'].includes(v.correctionType) && optionalStamps(v,['previousCheckInAt','newCheckInAt','previousCheckOutAt','newCheckOutAt'],true) && nullableInteger(v.previousWorkedMinutes) && nullableInteger(v.newWorkedMinutes) && text(v.reason) && (v.correctedBy === null || actor(v.correctedBy)) && hrTimestamp(v.correctedAt,true)
const leave = v => object(v) && id(v.requestId) && (v.staff === null || staffRef(v.staff)) && (v.leaveType === null || named(v.leaveType)) && hrDate(v.startDate) && hrDate(v.endDate) && v.endDate >= v.startDate && integer(v.calendarDays) && v.calendarDays > 0 && text(v.reason) && nullableText(v.reviewReason) && nullableText(v.cancellationReason) && ['PENDING','APPROVED','REJECTED','CANCELLED'].includes(v.status) && stamps(v,['submittedAt','createdAt','updatedAt']) && optionalStamps(v,['reviewedAt','cancelledAt']) && (v.reviewedBy === null || actor(v.reviewedBy)) && (v.cancelledBy === null || actor(v.cancelledBy))
const roster = v => object(v) && id(v.id) && (v.staff === null || staffRef(v.staff)) && (v.shift === null || shift(v.shift)) && hrDate(v.rosterDate) && stamps(v,['createdAt','updatedAt']) && (v.shift === null ? v.scheduledStart === null && v.scheduledEnd === null : stamps(v,['scheduledStart','scheduledEnd'])) && optionalStamps(v,['cancelledAt']) && ['SCHEDULED','CANCELLED'].includes(v.status) && nullableId(v.cancelledBy) && nullableText(v.remarks) && nullableText(v.cancellationReason)
const candidate = v => object(v) && id(v.userId) && text(v.username) && nullableText(v.fullName) && nullableText(v.role) && nullableText(v.status)
const validators = { master, shift, staff, attendance, correction, leave, roster, candidate }
export function hrResponse(response, kind, { list = false, nullable = false, target, date } = {}) {
  const envelope = response?.data
  const fail = () => { throw new Error('HR data unavailable: invalid authoritative response.') }
  if (!object(envelope) || envelope.success !== true || !Object.hasOwn(envelope,'data')) fail()
  const value = envelope.data
  if (value === null && nullable && !list) return null
  const valid = validators[kind]
  const rows = list ? value : [value]
  if (!valid || !Array.isArray(rows) || !rows.every(v => valid(v))) fail()
  const key = { attendance:'attendanceId', correction:'correctionId', leave:'requestId', staff:'staffProfileId', candidate:'userId' }[kind] || 'id'
  if (new Set(rows.map(v => v[key])).size !== rows.length) fail()
  if (target && rows.some(v => (kind === 'correction' ? v.attendanceId : v[key]) !== target)) fail()
  if (date && rows.some(v => v.businessDate !== date)) fail()
  return value
}
