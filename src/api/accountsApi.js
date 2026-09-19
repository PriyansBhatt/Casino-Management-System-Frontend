import axios from './axiosInstance'
const options = { skipUnauthorizedRedirect: true }
const data = response => {
  if (response.data?.success !== true || response.data.data == null) throw Error('Authoritative Accounts response unavailable.')
  return response.data.data
}
const id = value => { if (!/^[a-f0-9-]{36}$/i.test(value || '')) throw Error('Invalid Accounts ID.'); return value }
export default {
  read: async (kind, params = {}) => {
    let path
    if (['context','bills','parties','sources'].includes(kind)) path = kind
    else if (kind === 'detail') path = `bills/${id(params.id)}`
    else if (['revisions','decisions','evidence'].includes(kind)) path = `bills/${id(params.id)}/history/${kind}`
    else throw Error('Invalid Accounts read.')
    return data(await axios.get(`/accounts/${path}`, { ...options, params }))
  },
  mutate: async (op, file) => {
    const { operationType: kind, target, payload, operationKey } = op
    const actions = ['submit','verify','approve','hold','resume','return','reject','corrections','upload']
    const path = kind === 'party' ? 'parties' : kind === 'create' ? 'bills' : actions.includes(kind) ? `bills/${id(target.id)}/${kind === 'upload' ? 'evidence' : kind}` : null
    if (!path) throw Error('Invalid saved Accounts operation.')
    let body = { ...payload, idempotencyKey: operationKey }
    if (kind === 'upload') {
      body = new FormData()
      body.append('idempotencyKey', operationKey); body.append('expectedVersion', payload.expectedVersion)
      body.append('invoiceDocument', payload.invoiceDocument); if (payload.replacesId) body.append('replacesId', payload.replacesId)
      body.append('file', file)
    }
    return data(await axios.post(`/accounts/${path}`, body, options))
  },
  document: async (bill, evidence) => {
    const result = await axios.get(`/accounts/bills/${id(bill)}/evidence/${id(evidence)}`, { ...options, responseType: 'blob' })
    if (!(result.data instanceof Blob) || !['application/pdf','image/jpeg','image/png'].includes(result.data.type) || !result.data.size) throw Error('Evidence download unavailable.')
    return result.data
  },
}
