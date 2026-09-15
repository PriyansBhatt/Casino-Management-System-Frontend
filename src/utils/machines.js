import { requestGuard, createMutationStore, confirmedThenRefresh, csvCell } from './pit.js'
import { statusPayload, lifecycleAllows } from './chipControl.js'
export { requestGuard, confirmedThenRefresh }
export const canManageMachines = role => role === 'SUPER_ADMIN'
export const isMachineRoute = path => ['/slot-machines','/slot-machine-gaming','/machine-gaming','/slots'].includes(path)
export const UNAVAILABLE = ['Machine Cash-In — Not available: financial integration not implemented.', 'Wallet / Credits — Not available.', 'Machine WIN/LOSS and Jackpot — Not available.', 'Redemption / Cashier payout — Not available.']
export function validateMachine(m) {
  if (!m?.id || !m.machineCode || !m.displayName || !['SLOT','AUTOMATIC_ROULETTE'].includes(m.machineType) || !['AVAILABLE','IN_USE','OUT_OF_SERVICE'].includes(m.operationalStatus)) throw Error('Machine response unavailable.')
  if ((m.operationalStatus === 'IN_USE') !== Boolean(m.activePlay)) throw Error('Machine occupancy unavailable.')
  const p=m.activePlay
  if (p && (m.machineType !== 'SLOT' || p.machineId !== m.id || p.status !== 'ACTIVE' || !p.customerId || !p.customerSessionId || !p.customerCode || !p.sessionCode || !p.businessDate || !p.startedAt)) throw Error('Active play response unavailable.')
  return m
}
export function validateOverview(value) {
  if (!value || !Array.isArray(value.machines) || !['OPEN','UNAVAILABLE'].includes(value.businessDateStatus) || (value.businessDateStatus === 'OPEN' ? !/^\d{4}-\d{2}-\d{2}$/.test(value.businessDate) : value.businessDate !== null)) throw Error('Machine overview unavailable.')
  value.machines.forEach(validateMachine)
  return value
}
export async function loadMachines(api) {
  const [raw,status]=await Promise.all([api.overview(),api.operationalStatus().catch(()=>null)])
  const value=validateOverview(raw)
  let lifecycle=null
  try { lifecycle=statusPayload(status,value.businessDate) } catch {}
  return {...value,lifecycle}
}
export function canStart(machine,scope,role) {
  return canManageMachines(role) && machine?.machineType === 'SLOT' && machine.operationalStatus === 'AVAILABLE' && Boolean(scope?.businessDate) && lifecycleAllows(scope.lifecycle,false)
}
export function canEnd(machine,scope,role) {
  return canManageMachines(role) && Boolean(machine?.activePlay?.businessDate) && Boolean(scope?.businessDate) && machine?.operationalStatus === 'IN_USE' && lifecycleAllows(scope?.lifecycle,true)
}
export function endTarget(machine,scope,role) {
  if (!canEnd(machine,scope,role)) throw Error('Active play and current settlement permission are required.')
  return {kind:'end',idempotent:true,machineId:machine.id,machineCode:machine.machineCode,playId:machine.activePlay.id,payload:{expectedBusinessDate:machine.activePlay.businessDate}}
}
export function validateCandidates(rows,date) {
  if (!Array.isArray(rows) || rows.some(p=>!p.customerId||!p.customerCode||!p.customerName||!p.customerSessionId||!p.sessionCode||p.businessDate!==date)) throw Error('Verified session results unavailable or Business Date changed.')
  return rows
}
export function startTarget(machine,candidate,scope) {
  if (!candidate || candidate.businessDate !== scope.businessDate || !canStart(machine,scope,'SUPER_ADMIN')) throw Error('Select a verified current-date session and an available Slot.')
  return {kind:'start',idempotent:true,machineId:machine.id,machineCode:machine.machineCode,payload:{customerId:candidate.customerId,customerSessionId:candidate.customerSessionId,expectedBusinessDate:scope.businessDate}}
}
export function machineCsv(rows) {
  return [['Machine Code','Name','Type','Location','Status','Customer Code','Session','Business Date'],...rows.map(m=>[m.machineCode,m.displayName,m.machineType,m.location,m.operationalStatus,m.activePlay?.customerCode,m.activePlay?.sessionCode,m.activePlay?.businessDate])].map(row=>row.map(csvCell).join(',')).join('\n')
}
const stores=new Map()
export function machineMutationStore(actor) {
  if(!stores.has(actor)) {
    let storage;try {storage=globalThis.sessionStorage} catch {}
    stores.set(actor,createMutationStore(undefined,storage,`machine-pending:${actor}`))
  }
  return stores.get(actor)
}
