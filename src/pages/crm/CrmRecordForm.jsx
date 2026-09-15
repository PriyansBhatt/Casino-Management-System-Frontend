import { useEffect, useRef, useState } from 'react'
import api from '../../api/crmApi'
import { createGate, validCost } from '../../utils/crm'
const input = 'w-full rounded-lg border border-slate-300 p-2 text-sm'
export default function CrmRecordForm({ kind, busy, onSave }) {
 const [query, setQuery] = useState(''), [matches, setMatches] = useState([]), [customer, setCustomer] = useState(null), [error, setError] = useState('')
 const [form, setForm] = useState({ serviceType:'GIFT', transportType:'AIRPORT_PICKUP', classification:'UNSPECIFIED', billingType:'CASINO_COMPLIMENTARY', numberOfGuests:'1', cost:'' })
 const gate = useRef(createGate())
 useEffect(() => { const id = gate.current.next(); setMatches([]); if (customer || query.trim().length < 2) return
  const timer = setTimeout(async () => { try { const rows = await api.customers(query); if (gate.current.current(id)) { setMatches(rows); setError('') } } catch(e) { if(gate.current.current(id)) setError(e.message) } },250)
  return () => { clearTimeout(timer); gate.current.next() }
 },[query,customer])
 const field = (name,label,type='text',required=true) => <label className="block text-sm">{label}<input disabled={busy} required={required} type={type} className={input} value={form[name] || ''} onChange={e => setForm(f=>({...f,[name]:e.target.value}))} /></label>
 const select = (name,label,values) => <label className="block text-sm">{label}<select disabled={busy} className={input} value={form[name]} onChange={e=>setForm(f=>({...f,[name]:e.target.value}))}>{values.map(v=><option key={v}>{v}</option>)}</select></label>
 const submit = (e) => { e.preventDefault(); setError(''); if (!customer) return setError('Select an authoritative customer.'); if(!validCost(form.cost)) return setError('Cost must be nonnegative, at most 17 whole digits and 2 decimal places.')
  const common={customerId:customer.id,customerSessionId:null}
  let payload
  if(kind==='hotel') { if(form.cost==='')return setError('Hotel estimated cost is required.'); if(!/^[1-9]\d*$/.test(form.numberOfGuests)||Number(form.numberOfGuests)>2147483647)return setError('Invalid guest count.'); if(form.checkOutDate<form.checkInDate)return setError('Check-out cannot precede check-in.'); payload={...common,hotelName:form.hotelName,roomType:form.roomType,checkInDate:form.checkInDate,checkOutDate:form.checkOutDate,numberOfGuests:Number(form.numberOfGuests),estimatedCost:form.cost,billingType:form.billingType,remarks:form.notes||null} }
  else if(kind==='transport') payload={...common,transportType:form.transportType,pickup:form.pickup,destination:form.destination,scheduledAt:form.at,vehicle:form.vehicle||null,driver:form.driver||null,cost:form.cost===''?null:form.cost,notes:form.notes||null}
  else payload={...common,serviceType:form.serviceType,description:form.description,serviceAt:form.at,cost:form.cost===''?null:form.cost,classification:form.classification,notes:form.notes||null}
  onSave(kind,payload)
 }
 return <form onSubmit={submit} className="space-y-3 rounded-xl border bg-white p-4"><h2 className="font-bold">Add {kind==='hotel'?'Hotel Stay':kind==='transport'?'Transport Record':'Service Record'}</h2>
 <label className="block text-sm">Customer search<input disabled={busy} className={input} value={query} onChange={e=>{gate.current.next();setQuery(e.target.value);setCustomer(null)}} placeholder="Customer code or name" /></label>
 {matches.map(c=><button disabled={busy} type="button" key={c.id} className="block text-left text-sm" onClick={()=>{gate.current.next();setCustomer(c);setQuery(`${c.customerCode} · ${c.fullName}`);setMatches([])}}>{c.customerCode} · {c.fullName}</button>)}
 {customer&&<p className="text-sm text-emerald-700">Selected: {customer.customerCode}</p>}
 {kind==='hotel'?<>{field('hotelName','Hotel')}{field('roomType','Room type')}{field('checkInDate','Check-in date','date')}{field('checkOutDate','Check-out date','date')}{field('numberOfGuests','Guests','number')}{select('billingType','Billing',['CASINO_COMPLIMENTARY','CUSTOMER_DIRECT'])}</>:kind==='transport'?<>{select('transportType','Type',['AIRPORT_PICKUP','AIRPORT_DROP','LOCAL_TRAVEL','OTHER'])}{field('pickup','Pickup')}{field('destination','Destination')}{field('at','Scheduled time (Kathmandu)','datetime-local')}{field('vehicle','Vehicle information','text',false)}{field('driver','Driver information','text',false)}</>:<>{select('serviceType','Type',['GIFT','FOOD','TICKET','OTHER'])}{field('description','Description')}{field('at','Actual service time (Kathmandu)','datetime-local')}{select('classification','Classification',['UNSPECIFIED','COMPLIMENTARY','CUSTOMER_PAID'])}</>}
 {field('cost',kind==='hotel'?'Estimated cost NPR':'Recorded cost NPR — blank means unknown','text',kind==='hotel')}{field('notes','Notes','text',false)}
 <p className="text-xs text-slate-500">Informational record. No cash, chips or session opening. Session link omitted.</p>{error&&<p role="alert" className="text-red-700">{error}</p>}<button disabled={busy||!customer} className="rounded-lg bg-amber-400 px-4 py-2 font-bold disabled:opacity-50">Save record</button></form>
}
