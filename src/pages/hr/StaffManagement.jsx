import { useCallback, useEffect, useMemo, useState } from 'react'
import hrApi from '../../api/hrApi'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Loading from '../../components/ui/Loading'
import useToast from '../../hooks/useToast'

const EMPLOYMENT_STATUSES = ['ACTIVE', 'SUSPENDED', 'INACTIVE', 'TERMINATED']
const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY']
const emptyStaffForm = {
  userId: '', employeeCode: '', departmentId: '', jobTitleId: '', employmentStatus: 'ACTIVE',
  employmentType: 'FULL_TIME', dateOfJoining: '', phone: '', reportingManagerStaffProfileId: '', remarks: '',
}
const emptyMasterForm = { code: '', name: '', description: '', active: true, sortOrder: '' }

const StaffManagement = () => {
  const { showToast } = useToast()
  const [tab, setTab] = useState('staff')
  const [staff, setStaff] = useState([])
  const [departments, setDepartments] = useState([])
  const [jobTitles, setJobTitles] = useState([])
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [jobTitleFilter, setJobTitleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [staffRows, departmentRows, titleRows, candidateRows] = await Promise.all([
        hrApi.getStaff(), hrApi.getDepartments(), hrApi.getJobTitles(), hrApi.getStaffCandidates(),
      ])
      setStaff(staffRows)
      setDepartments(departmentRows)
      setJobTitles(titleRows)
      setCandidates(candidateRows)
      if (selected) setSelected(staffRows.find((row) => row.staffProfileId === selected.staffProfileId) || null)
    } catch (requestError) {
      setStaff([]); setDepartments([]); setJobTitles([]); setCandidates([])
      setError(requestError.message || 'Unable to load authoritative HR data.')
    } finally {
      setLoading(false)
    }
  }, [selected])

  useEffect(() => { void loadAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase()
    return staff.filter((row) => {
      const matchesSearch = !query || [row.employeeCode, row.fullName, row.username, row.phone]
        .some((value) => String(value || '').toLowerCase().includes(query))
      return matchesSearch && (!departmentFilter || row.department?.id === departmentFilter)
        && (!jobTitleFilter || row.jobTitle?.id === jobTitleFilter)
        && (!statusFilter || row.employmentStatus === statusFilter)
        && (!typeFilter || row.employmentType === typeFilter)
    })
  }, [staff, search, departmentFilter, jobTitleFilter, statusFilter, typeFilter])

  const openStaff = (profile = null) => setDialog({ type: 'staff', editing: Boolean(profile), record: profile, form: profile ? {
    departmentId: profile.department?.id || '', jobTitleId: profile.jobTitle?.id || '',
    employmentStatus: profile.employmentStatus, employmentType: profile.employmentType,
    dateOfJoining: profile.dateOfJoining || '', phone: profile.phone || '',
    reportingManagerStaffProfileId: profile.reportingManager?.staffProfileId || '', remarks: profile.remarks || '',
  } : { ...emptyStaffForm } })

  const openMaster = (kind, record = null) => setDialog({ type: kind, editing: Boolean(record), record, form: record ? {
    name: record.name, description: record.description || '', active: record.active,
    sortOrder: record.sortOrder ?? '',
  } : { ...emptyMasterForm } })

  const changeForm = (field, value) => setDialog((current) => ({ ...current, form: { ...current.form, [field]: value } }))

  const save = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      if (dialog.type === 'staff') {
        const payload = {
          ...dialog.form,
          phone: dialog.form.phone.trim() || null,
          reportingManagerStaffProfileId: dialog.form.reportingManagerStaffProfileId || null,
          remarks: dialog.form.remarks.trim() || null,
        }
        if (dialog.editing) await hrApi.updateStaffProfile(selected.staffProfileId, payload)
        else await hrApi.createStaffProfile({ ...payload, employeeCode: payload.employeeCode.trim() })
      } else {
        const payload = {
          name: dialog.form.name.trim(), description: dialog.form.description.trim() || null,
          active: dialog.form.active,
          ...(dialog.type === 'department' ? { sortOrder: dialog.form.sortOrder === '' ? null : Number(dialog.form.sortOrder) } : {}),
        }
        const api = dialog.type === 'department'
          ? { create: hrApi.createDepartment, update: hrApi.updateDepartment }
          : { create: hrApi.createJobTitle, update: hrApi.updateJobTitle }
        if (dialog.editing) await api.update(dialog.record.id, payload)
        else await api.create({ ...payload, code: dialog.form.code.trim() })
      }
      showToast({ type: 'success', title: 'HR record saved', message: 'The authoritative backend record has been refreshed.' })
      setDialog(null)
      await loadAll()
    } catch (requestError) {
      showToast({ type: 'error', title: 'Unable to save', message: requestError.message || 'The HR record could not be saved.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Staff Management" description="Authoritative staff profiles, departments, and job titles." />
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <Tab active={tab === 'staff'} onClick={() => setTab('staff')}>Staff Directory</Tab>
        <Tab active={tab === 'departments'} onClick={() => setTab('departments')}>Departments</Tab>
        <Tab active={tab === 'titles'} onClick={() => setTab('titles')}>Job Titles</Tab>
      </div>

      {loading && <Card><Loading message="Loading authoritative HR data..." size="sm" /></Card>}
      {!loading && error && <ErrorState title="HR data unavailable" description={error} onRetry={loadAll} />}
      {!loading && !error && tab === 'staff' && (
        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Field label="Search"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Code, name, username, phone" className={inputClass} /></Field>
              <Field label="Department"><select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className={inputClass}><option value="">All departments</option>{departments.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
              <Field label="Job Title"><select value={jobTitleFilter} onChange={(e) => setJobTitleFilter(e.target.value)} className={inputClass}><option value="">All job titles</option>{jobTitles.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
              <Field label="Employment Status"><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}><option value="">All statuses</option>{EMPLOYMENT_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></Field>
              <Field label="Employment Type"><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={inputClass}><option value="">All types</option>{EMPLOYMENT_TYPES.map((value) => <option key={value}>{label(value)}</option>)}</select></Field>
            </div>
            <Button type="button" onClick={() => openStaff()}>Create Staff Profile</Button>
          </div>
          <div className="mt-5">
            {filteredStaff.length === 0 ? <EmptyState title="No staff profiles found" description="No authoritative staff record matches the current filters." /> : (
              <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><Th>Employee</Th><Th>Code</Th><Th>Department</Th><Th>Job Title</Th><Th>Type</Th><Th>Status</Th><Th /></tr></thead><tbody className="divide-y divide-slate-100">{filteredStaff.map((row) => <tr key={row.staffProfileId}><Td><p className="font-bold text-slate-950">{row.fullName || 'Name unavailable'}</p><p className="text-xs text-slate-500">{row.username || 'Username unavailable'}</p></Td><Td>{row.employeeCode}</Td><Td>{row.department?.name || 'Unavailable'}</Td><Td>{row.jobTitle?.name || 'Unavailable'}</Td><Td>{label(row.employmentType)}</Td><Td><Status active={row.employmentStatus === 'ACTIVE'}>{row.employmentStatus}</Status></Td><Td><Button type="button" variant="outline" size="sm" onClick={() => setSelected(row)}>View</Button></Td></tr>)}</tbody></table></div>
            )}
          </div>
        </Card>
      )}

      {!loading && !error && tab !== 'staff' && (
        <MasterList title={tab === 'departments' ? 'Departments' : 'Job Titles'} rows={tab === 'departments' ? departments : jobTitles} onCreate={() => openMaster(tab === 'departments' ? 'department' : 'title')} onEdit={(row) => openMaster(tab === 'departments' ? 'department' : 'title', row)} />
      )}

      {selected && <StaffDetail profile={selected} onClose={() => setSelected(null)} onEdit={() => openStaff(selected)} />}
      {dialog && <Editor dialog={dialog} staff={staff} departments={departments} jobTitles={jobTitles} candidates={candidates} saving={saving} onChange={changeForm} onClose={() => setDialog(null)} onSubmit={save} />}
    </div>
  )
}

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100'
const label = (value) => String(value || '').replaceAll('_', ' ')
const Tab = ({ active, onClick, children }) => <button type="button" onClick={onClick} className={`rounded-lg px-4 py-2 text-sm font-black ${active ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{children}</button>
const Field = ({ label: fieldLabel, children }) => <label className="block text-xs font-bold text-slate-600">{fieldLabel}<span className="mt-1 block">{children}</span></label>
const Th = ({ children }) => <th className="px-4 py-3">{children}</th>
const Td = ({ children }) => <td className="px-4 py-4 text-slate-700">{children}</td>
const Status = ({ active, children }) => <span className={`rounded-full px-2.5 py-1 text-xs font-black ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{children}</span>

const MasterList = ({ title, rows, onCreate, onEdit }) => <Card><div className="flex items-center justify-between border-b border-slate-200 pb-4"><div><h2 className="text-lg font-black text-slate-950">{title}</h2><p className="text-sm text-slate-500">Codes are canonical and cannot be changed after creation.</p></div><Button type="button" onClick={onCreate}>Add {title === 'Departments' ? 'Department' : 'Job Title'}</Button></div><div className="mt-5">{rows.length === 0 ? <EmptyState title={`No ${title.toLowerCase()} found`} /> : <div className="grid gap-3 lg:grid-cols-2">{rows.map((row) => <div key={row.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="font-black text-slate-950">{row.name}</h3><Status active={row.active}>{row.active ? 'ACTIVE' : 'INACTIVE'}</Status></div><p className="mt-1 text-xs font-bold text-slate-500">{row.code}</p><p className="mt-2 text-sm text-slate-600">{row.description || 'No description provided.'}</p></div><Button type="button" variant="outline" size="sm" onClick={() => onEdit(row)}>Edit</Button></div></div>)}</div>}</div></Card>

const StaffDetail = ({ profile, onClose, onEdit }) => <Overlay><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-blue-700">{profile.employeeCode}</p><h2 className="mt-1 text-2xl font-black text-slate-950">{profile.fullName || 'Name unavailable'}</h2><p className="text-sm text-slate-500">{profile.username}</p></div><button type="button" onClick={onClose} className="text-2xl text-slate-400">×</button></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><Detail label="Department" value={profile.department?.name} /><Detail label="Job Title" value={profile.jobTitle?.name} /><Detail label="Employment" value={`${label(profile.employmentType)} · ${profile.employmentStatus}`} /><Detail label="Date of Joining" value={profile.dateOfJoining} /><Detail label="Phone" value={profile.phone} /><Detail label="Reporting Manager" value={profile.reportingManager?.fullName || profile.reportingManager?.employeeCode} /></div>{profile.remarks && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700"><p className="mb-1 text-xs font-black uppercase text-slate-500">Remarks</p>{profile.remarks}</div>}<div className="mt-6 flex justify-end"><Button type="button" onClick={onEdit}>Edit Staff Profile</Button></div></Overlay>
const Detail = ({ label: detailLabel, value }) => <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-slate-500">{detailLabel}</p><p className="mt-1 font-bold text-slate-950">{value || 'Unavailable'}</p></div>

const Editor = ({ dialog, staff, departments, jobTitles, candidates, saving, onChange, onClose, onSubmit }) => {
  const isStaff = dialog.type === 'staff'
  const activeDepartments = departments.filter((row) => row.active || row.id === dialog.form.departmentId)
  const activeTitles = jobTitles.filter((row) => row.active || row.id === dialog.form.jobTitleId)
  return <Overlay><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-blue-700">Authoritative HR</p><h2 className="mt-1 text-xl font-black text-slate-950">{dialog.editing ? 'Edit' : 'Create'} {isStaff ? 'Staff Profile' : dialog.type === 'department' ? 'Department' : 'Job Title'}</h2></div><button type="button" onClick={onClose} disabled={saving} className="text-2xl text-slate-400">×</button></div><form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
    {isStaff ? <>
      {!dialog.editing && <><Field label="Linked User"><select required disabled={candidates.length === 0} value={dialog.form.userId} onChange={(e) => onChange('userId', e.target.value)} className={inputClass}><option value="">{candidates.length === 0 ? 'No unlinked users available' : 'Select an unlinked user'}</option>{candidates.map((row) => <option key={row.userId} value={row.userId}>{row.fullName || row.username} · {row.role} · {row.status}</option>)}</select></Field><Field label="Employee Code"><input required maxLength={50} value={dialog.form.employeeCode} onChange={(e) => onChange('employeeCode', e.target.value)} className={inputClass} /></Field></>}
      <Field label="Department"><select required value={dialog.form.departmentId} onChange={(e) => onChange('departmentId', e.target.value)} className={inputClass}><option value="">Select department</option>{activeDepartments.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
      <Field label="Job Title"><select required value={dialog.form.jobTitleId} onChange={(e) => onChange('jobTitleId', e.target.value)} className={inputClass}><option value="">Select job title</option>{activeTitles.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
      <Field label="Employment Status"><select required value={dialog.form.employmentStatus} onChange={(e) => onChange('employmentStatus', e.target.value)} className={inputClass}>{EMPLOYMENT_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></Field>
      <Field label="Employment Type"><select required value={dialog.form.employmentType} onChange={(e) => onChange('employmentType', e.target.value)} className={inputClass}>{EMPLOYMENT_TYPES.map((value) => <option key={value}>{label(value)}</option>)}</select></Field>
      <Field label="Date of Joining"><input required type="date" value={dialog.form.dateOfJoining} onChange={(e) => onChange('dateOfJoining', e.target.value)} className={inputClass} /></Field>
      <Field label="Phone"><input maxLength={50} value={dialog.form.phone} onChange={(e) => onChange('phone', e.target.value)} className={inputClass} /></Field>
      <Field label="Reporting Manager"><select value={dialog.form.reportingManagerStaffProfileId} onChange={(e) => onChange('reportingManagerStaffProfileId', e.target.value)} className={inputClass}><option value="">Not assigned</option>{staff.filter((row) => !dialog.editing || row.staffProfileId !== dialog.record?.staffProfileId).map((row) => <option key={row.staffProfileId} value={row.staffProfileId}>{row.fullName || row.username} · {row.employeeCode}</option>)}</select></Field>
      <div className="sm:col-span-2"><Field label="Remarks"><textarea maxLength={1000} rows={3} value={dialog.form.remarks} onChange={(e) => onChange('remarks', e.target.value)} className={inputClass} /></Field></div>
    </> : <>
      {!dialog.editing && <Field label="Code"><input required maxLength={50} value={dialog.form.code} onChange={(e) => onChange('code', e.target.value)} className={inputClass} /></Field>}
      <Field label="Name"><input required maxLength={150} value={dialog.form.name} onChange={(e) => onChange('name', e.target.value)} className={inputClass} /></Field>
      {dialog.type === 'department' && <Field label="Sort Order"><input type="number" value={dialog.form.sortOrder} onChange={(e) => onChange('sortOrder', e.target.value)} className={inputClass} /></Field>}
      <Field label="Status"><select value={dialog.form.active ? 'ACTIVE' : 'INACTIVE'} onChange={(e) => onChange('active', e.target.value === 'ACTIVE')} className={inputClass}><option>ACTIVE</option><option>INACTIVE</option></select></Field>
      <div className="sm:col-span-2"><Field label="Description"><textarea maxLength={1000} rows={3} value={dialog.form.description} onChange={(e) => onChange('description', e.target.value)} className={inputClass} /></Field></div>
    </>}
    <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 sm:col-span-2"><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving || (isStaff && !dialog.editing && candidates.length === 0)}>{saving ? 'Saving…' : 'Save'}</Button></div>
  </form></Overlay>
}

const Overlay = ({ children }) => <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"><div className="my-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">{children}</div></div>

export default StaffManagement
