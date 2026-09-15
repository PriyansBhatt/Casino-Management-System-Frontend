import axios from './axiosInstance'
import { validateOverview, validateMachine } from '../utils/machines'
const config={skipUnauthorizedRedirect:true}
const data=response=>{
  if(response.data?.success!==true || response.data.data==null) throw Error('Authoritative machine response unavailable.')
  return response.data.data
}
const machineApi={
  overview:async()=>validateOverview(data(await axios.get('/machines',config))),
  operationalStatus:async()=>data(await axios.get('/business-status/current',config)),
  detail:async id=>{
    const result=data(await axios.get(`/machines/${id}`,config))
    validateMachine(result.machine)
    if(result.machine.id!==id || !Array.isArray(result.recentPlays) || result.recentPlays.some(p=>p.machineId!==id||p.status!=='ENDED')) throw Error('Machine history unavailable.')
    return result
  },
  candidates:async query=>data(await axios.get('/machines/eligible-players',{...config,params:{query}})),
  mutate:async op=>{
    const paths={create:'/machines',status:`/machines/${op.machineId}/status`,start:`/machines/${op.machineId}/plays`,end:`/machines/${op.machineId}/plays/${op.playId}/end`}
    if(!paths[op.kind]) throw Error('Unknown machine operation.')
    const value=data(await axios.post(paths[op.kind],op.payload,config))
    if(['start','end'].includes(op.kind)) {
      if(value.machineId!==op.machineId || !value.playId || value.businessDate!==op.payload.expectedBusinessDate || op.kind==='end'&&value.playId!==op.playId) throw Error('Operation receipt unconfirmed; retain the original request.')
    } else validateMachine(value)
    return value
  }
}
export default machineApi
