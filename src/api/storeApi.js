import axios from './axiosInstance'
const options = { skipUnauthorizedRedirect: true }
const data = response => {
  if (response.data?.success !== true || response.data.data == null) throw Error('Store response unavailable.')
  return response.data.data
}
export default {
  list: async (kind, params) => {
    if (!['items','staff','requests','procurements','movements'].includes(kind)) throw Error('Invalid Store read.')
    return data(await axios.get(`/store/${kind}`,{...options,params}))
  },
  detail: async id => data(await axios.get(`/store/requests/${encodeURIComponent(id)}`,options)),
  mutate: async operation => {
    const { operationType:kind,target,payload,operationKey }=operation
    const patterns={
      createItem:/^items$/,editItem:/^items\/[a-f\d-]{36}$/,createRequest:/^requests$/,
      opening:/^items\/[a-f\d-]{36}\/opening-stock$/,adjust:/^items\/[a-f\d-]{36}\/adjustments$/,
      issue:/^request-lines\/[a-f\d-]{36}\/issues$/,procure:/^request-lines\/[a-f\d-]{36}\/procurements$/,
      receive:/^procurements\/[a-f\d-]{36}\/receive$/,order:/^procurements\/[a-f\d-]{36}\/order$/,
      cancelProcurement:/^procurements\/[a-f\d-]{36}\/cancel$/,cancelRequest:/^requests\/[a-f\d-]{36}\/cancel-remaining$/,
    }
    if(!patterns[kind]?.test(target.path))throw Error('Invalid saved Store operation. No request sent.')
    const keyed=['createRequest','opening','adjust','issue','procure','receive'].includes(kind)
    const body=keyed?{...payload,idempotencyKey:operationKey}:payload
    return data(await axios[kind==='editItem'?'patch':'post'](`/store/${target.path}`,body,options))
  },
}
