import { useEffect, useRef, useState } from 'react'
import api from '../../api/fnbApi'
import { createGate, createPayload, department } from '../../utils/fnb'
export default function FnbRequestForm({ businessDate, busy, onSave }) {
 const [query,setQuery] = useState(''), [customer,setCustomer] = useState(null), [matches,setMatches] = useState([]), [error,setError] = useState('')
 const [form,setForm] = useState({ type:'FOOD', item:'', quantity:'1', location:'', remarks:'', customerSessionId:'' })
 const gate = useRef(createGate())
 useEffect(() => {
  const generation=gate.current.next();setMatches([])
  if(customer || query.trim().length<2)return
  const timer=setTimeout(async()=>{try{const found=await api.customers(query);if(gate.current.current(generation)){setMatches(found);setError('')}}catch(e){if(gate.current.current(generation))setError(e.message)}},250)
  return()=>{clearTimeout(timer);gate.current.next()}
 },[query,customer])
 const field=(name,label,required=true)=> <label className="block">{label}<input className="block w-full rounded border p-3" disabled={busy} required={required} value={form[name]} onChange={e=>setForm(f=>({...f,[name]:e.target.value}))}/></label>
 const submit=e=>{e.preventDefault();try{const payload=createPayload(form,customer,businessDate);setError('');onSave(payload)}catch(e){setError(e.message)}}
 return <form onSubmit={submit} className="max-w-xl space-y-4 rounded-xl border bg-white p-5">
 <p>Complimentary guest request · Business Date: {businessDate || 'Unavailable'}</p>
 <label className="block">Customer / CID search<input className="block w-full rounded border p-3" disabled={busy} value={query} onChange={e=>{gate.current.next();setMatches([]);setCustomer(null);setQuery(e.target.value)}}/></label>
 {matches.map(c=><button type="button" disabled={busy} className="block rounded border p-3" key={c.id} onClick={()=>{gate.current.next();setCustomer(c);setQuery(`${c.customerCode} · ${c.fullName}`);setMatches([])}}>{c.customerCode} · {c.fullName}</button>)}
 <p>{customer?`Selected CID: ${customer.customerCode}`:'Select an authoritative customer.'}</p>
 <label>Type<select disabled={busy} className="ml-3 rounded border p-3" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}><option value="FOOD">Food</option><option value="BEVERAGE">Beverage</option></select></label>
 <p>Department: {department(form.type)}</p>
 {field('item','Item (one item per request)')}{field('quantity','Quantity')}{field('location','Delivery location')}{field('customerSessionId','Reception session UUID (optional historical context)',false)}{field('remarks','Remarks',false)}
 <p className="text-sm">Requested by your authenticated account. Session ownership is checked by the backend.</p>
 {error&&<p role="alert" className="text-red-700">{error}</p>}
 <button className="rounded bg-amber-400 p-3 font-bold disabled:opacity-50" disabled={busy||!customer||!businessDate}>Create request</button>
 </form>
}
