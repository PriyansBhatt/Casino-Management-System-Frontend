import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createIdentityDocument,
  getCustomerKyc,
  getCustomerDirectory,
  getPrivilegedCustomerKyc,
  registerCustomer,
  updateCustomerClassification,
  updateCustomerKyc,
} from '../../api/customerApi'
import { getErrorMessage, isNetworkError } from '../../utils/errorUtils'
import useAuth from '../../hooks/useAuth'
import { canManageCustomers, createCustomerRequestGuard, customerDirectoryCsv, directorySummary, fetchCustomerProfile, filterCustomerDirectory, lastVisitLabel, mapCustomerDirectory, UNAVAILABLE } from '../../utils/customersKyc'

const emptyCustomerForm = {
  fullName: '',
  nationality: '',
  contact: '',
  address: '',
  idType: '',
  idNumber: '',
  category: 'Normal',
  remarks: '',
}

const emptyKycForm = {
  dateOfBirth: '',
  gender: '',
  permanentAddress: '',
  currentAddress: '',
  email: '',
  occupation: '',
}

const emptyIdentityForm = {
  documentType: '',
  documentNumber: '',
  issuingCountry: '',
  issuedDate: '',
  expiryDate: '',
  primaryDocument: false,
}

const emptyClassificationForm = {
  category: 'NORMAL',
  riskLevel: 'LOW',
  internalNotes: '',
}

const mapBackendCustomer = (customer) => mapCustomerDirectory([customer])[0]

const CustomersKyc = () => {
  const { user } = useAuth()
  const directoryRequests = useRef(createCustomerRequestGuard())
  const profileRequests = useRef(createCustomerRequestGuard())
  const profileTarget = useRef(null)
  const profileSaving = useRef(false)
  const registrationPending = useRef(false)
  const [customers, setCustomers] = useState([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true)
  const [customersError, setCustomersError] = useState(null)

  const [viewMode, setViewMode] = useState('RECEPTION')
  const [searchTerm, setSearchTerm] = useState('')
  const [nationalityFilter, setNationalityFilter] = useState('ALL')

  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerProfile, setCustomerProfile] = useState(null)
  const [privilegedProfile, setPrivilegedProfile] = useState(null)
  const [identityDocuments, setIdentityDocuments] = useState([])
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [profileError, setProfileError] = useState(null)
  const [profileAction, setProfileAction] = useState(null)
  const [profileActionError, setProfileActionError] = useState(null)
  const [kycForm, setKycForm] = useState(emptyKycForm)
  const [identityForm, setIdentityForm] = useState(emptyIdentityForm)
  const [classificationForm, setClassificationForm] = useState(emptyClassificationForm)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)

  const [customerForm, setCustomerForm] = useState(emptyCustomerForm)
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  const canViewPrivileged = canManageCustomers(user?.role)
  const isDirectorView = canViewPrivileged && viewMode === 'DIRECTOR'
  const directoryAvailable = !isLoadingCustomers && !customersError

  useEffect(() => {
    setViewMode(canViewPrivileged ? 'DIRECTOR' : 'RECEPTION')
  }, [canViewPrivileged])

  const loadCustomers = useCallback(async () => {
    if (registrationPending.current) return
    const isCurrent = directoryRequests.current.next()
    setIsLoadingCustomers(true)
    setCustomersError(null)
    setCustomers([])
    try {
      const data = mapCustomerDirectory(await getCustomerDirectory())
      if (isCurrent()) setCustomers(data)
    } catch (error) {
      if (isCurrent()) setCustomersError('Unable to load customer records. Directory totals are unavailable.')
    } finally {
      if (isCurrent()) setIsLoadingCustomers(false)
    }
  }, [])

  useEffect(() => {
    loadCustomers()
    return () => {
      directoryRequests.current.invalidate()
      profileRequests.current.invalidate()
      profileTarget.current = null
    }
  }, [loadCustomers])

  // A mode change closes the profile and invalidates its forms and pending requests.
  useEffect(() => {
    profileRequests.current.invalidate()
    profileTarget.current = null
    setSelectedCustomer(null)
    setCustomerProfile(null)
    setPrivilegedProfile(null)
    setIdentityDocuments([])
    setProfileAction(null)
    setKycForm(emptyKycForm)
    setIdentityForm(emptyIdentityForm)
    setClassificationForm(emptyClassificationForm)
  }, [isDirectorView, user?.role])

  const summary = useMemo(() => directorySummary(customers, directoryAvailable), [customers, directoryAvailable])
  const filteredCustomers = useMemo(() =>
    filterCustomerDirectory(customers, searchTerm, nationalityFilter),
  [customers, searchTerm, nationalityFilter])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })

    window.setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const profileRequestError = (error, fallback) => {
    const status = error.response?.status ?? error.normalized?.status
    if (status === 400) return getErrorMessage(error) || 'Please check the entered details.'
    if (status === 401) return 'Your session has expired. Please sign in again.'
    if (status === 403) return 'You are not authorized to perform this customer KYC action.'
    if (status === 404) return 'The customer record could not be found.'
    if (status === 409) return getErrorMessage(error) || 'This identity document already exists.'
    if (isNetworkError(error)) return 'The backend is unavailable. Please try again when the server is running.'
    return getErrorMessage(error) || fallback
  }

  const applyKycForm = (profile) => {
    setKycForm({
      dateOfBirth: profile?.dateOfBirth || '',
      gender: profile?.gender || '',
      permanentAddress: profile?.permanentAddress || '',
      currentAddress: profile?.currentAddress || '',
      email: profile?.email || '',
      occupation: profile?.occupation || '',
    })
  }

  const applyClassificationForm = (profile) => {
    setClassificationForm({
      category: profile?.category || 'NORMAL',
      riskLevel: profile?.riskLevel || 'LOW',
      internalNotes: profile?.internalNotes || '',
    })
  }

  const loadCustomerProfile = async (customer, privileged = isDirectorView) => {
    if (profileTarget.current !== customer.id) return
    const isCurrent = profileRequests.current.next()
    setIsLoadingProfile(true)
    setCustomerProfile(null)
    setPrivilegedProfile(null)
    setIdentityDocuments([])
    setKycForm(emptyKycForm)
    setIdentityForm(emptyIdentityForm)
    setClassificationForm(emptyClassificationForm)
    setProfileAction(null)
    setProfileError(null)
    setProfileActionError(null)
    try {
      const { basic, management, documents } = await fetchCustomerProfile(
        { getCustomerKyc, getPrivilegedCustomerKyc }, customer.id, privileged && canViewPrivileged)
      if (!isCurrent() || profileTarget.current !== customer.id) return
      setCustomerProfile(basic)
      applyKycForm(basic)
      setPrivilegedProfile(management)
      setIdentityDocuments(documents)
      if (management) applyClassificationForm(management)
    } catch (error) {
      if (isCurrent()) setProfileError(profileRequestError(error, 'Unable to load the customer profile.'))
    } finally {
      if (isCurrent()) setIsLoadingProfile(false)
    }
  }

  const openCustomerProfile = (customer) => {
    if (profileSaving.current) return
    profileTarget.current = customer.id
    setSelectedCustomer(customer)
    loadCustomerProfile(customer)
  }

  const closeCustomerProfile = () => {
    if (profileSaving.current) return
    profileRequests.current.invalidate()
    profileTarget.current = null
    setSelectedCustomer(null)
    setCustomerProfile(null)
    setPrivilegedProfile(null)
    setIdentityDocuments([])
    setKycForm(emptyKycForm)
    setIdentityForm(emptyIdentityForm)
    setClassificationForm(emptyClassificationForm)
    setProfileAction(null)
    setProfileError(null)
    setProfileActionError(null)
  }

  const beginProfileSave = (privileged = false) => {
    const id = profileTarget.current
    if (profileSaving.current || isLoadingProfile || profileError || !id
        || selectedCustomer?.id !== id || customerProfile?.id !== id
        || (privileged && (!isDirectorView || privilegedProfile?.id !== id))) return null
    profileSaving.current = true
    setIsSavingProfile(true)
    setProfileActionError(null)
    return { id, isCurrent: profileRequests.current.next() }
  }

  const finishProfileSave = () => {
    profileSaving.current = false
    setIsSavingProfile(false)
  }

  const saveBasicKyc = async () => {
    const operation = beginProfileSave()
    if (!operation) return
    try {
      const updated = await updateCustomerKyc(operation.id, {
        dateOfBirth: kycForm.dateOfBirth || null,
        gender: kycForm.gender.trim() || null,
        permanentAddress: kycForm.permanentAddress.trim() || null,
        currentAddress: kycForm.currentAddress.trim() || null,
        email: kycForm.email.trim() || null,
        occupation: kycForm.occupation.trim() || null,
      })
      if (!operation.isCurrent()) return
      if (updated?.id !== operation.id) throw new Error('Customer response does not match the saved profile.')
      setCustomerProfile(updated)
      applyKycForm(updated)
      setProfileAction(null)
      showToast('Customer KYC updated successfully.')
    } catch (error) {
      if (operation.isCurrent()) setProfileActionError(profileRequestError(error, 'Unable to update customer KYC.'))
    } finally {
      finishProfileSave()
    }
  }

  const saveIdentityDocument = async () => {
    const errors = []
    if (!identityForm.documentType) errors.push('Document type is required.')
    if (!identityForm.documentNumber.trim()) errors.push('Document number is required.')
    if (identityForm.issuedDate && identityForm.expiryDate && identityForm.expiryDate < identityForm.issuedDate) {
      errors.push('Expiry date cannot be before issue date.')
    }
    if (errors.length) {
      setProfileActionError(errors.join(' '))
      return
    }

    const operation = beginProfileSave()
    if (!operation) return
    try {
      await createIdentityDocument(operation.id, {
        documentType: identityForm.documentType,
        documentNumber: identityForm.documentNumber.trim(),
        issuingCountry: identityForm.issuingCountry.trim() || null,
        issuedDate: identityForm.issuedDate || null,
        expiryDate: identityForm.expiryDate || null,
        primaryDocument: identityForm.primaryDocument,
      })
      if (!operation.isCurrent()) return
      setIdentityForm(emptyIdentityForm)
      setProfileAction(null)
      showToast('Identity document added successfully.')
      await loadCustomerProfile({ id: operation.id })
    } catch (error) {
      if (operation.isCurrent()) setProfileActionError(profileRequestError(error, 'Unable to add the identity document.'))
    } finally {
      finishProfileSave()
    }
  }

  const saveClassification = async () => {
    const operation = beginProfileSave(true)
    if (!operation) return
    try {
      const updated = await updateCustomerClassification(operation.id, {
        category: classificationForm.category,
        riskLevel: classificationForm.riskLevel,
        internalNotes: classificationForm.internalNotes.trim() || null,
      })
      if (!operation.isCurrent()) return
      if (updated?.id !== operation.id) throw new Error('Customer response does not match the saved profile.')
      setPrivilegedProfile(updated)
      applyClassificationForm(updated)
      setProfileAction(null)
      showToast('Customer classification updated successfully.')
    } catch (error) {
      if (operation.isCurrent()) setProfileActionError(profileRequestError(error, 'Unable to update customer classification.'))
    } finally {
      finishProfileSave()
    }
  }

  const validateForm = () => {
    const errors = {}

    const fullName = customerForm.fullName.trim()
    const phone = customerForm.contact.trim()
    const nationality = customerForm.nationality.trim()

    if (!fullName) {
      errors.fullName = 'Full name is required.'
    } else if (fullName.length < 2 || fullName.length > 150) {
      errors.fullName = 'Full name must be between 2 and 150 characters.'
    }

    if (!nationality) {
      errors.nationality = 'Nationality is required.'
    } else if (nationality.length > 100) {
      errors.nationality = 'Nationality must not exceed 100 characters.'
    }

    if (!phone) {
      errors.contact = 'Contact number is required.'
    } else if (!/^[0-9+\- ]{7,20}$/.test(phone)) {
      errors.contact = 'Enter a valid phone number using 7 to 20 digits, spaces, + or -.'
    }

    if (editingCustomer) {
      if (!customerForm.address.trim()) {
        errors.address = 'Address is required.'
      }

      if (!customerForm.idType) {
        errors.idType = 'ID type is required.'
      }

      if (!customerForm.idNumber.trim()) {
        errors.idNumber = 'ID number is required.'
      }

      const duplicateId = customers.some(
        (customer) =>
          customer.idNumber.trim().toLowerCase() ===
            customerForm.idNumber.trim().toLowerCase() &&
          customer.cid !== editingCustomer.cid,
      )

      if (duplicateId) {
        errors.idNumber =
          'A customer with this ID number already exists.'
      }
    }

    setFormErrors(errors)

    return Object.keys(errors).length === 0
  }

  const openNewCustomerModal = () => {
    setEditingCustomer(null)
    setCustomerForm(emptyCustomerForm)
    setFormErrors({})
    setShowCustomerModal(true)
  }

  const openEditCustomerModal = (customer) => {
    setEditingCustomer(customer)

    setCustomerForm({
      fullName: customer.name,
      nationality: customer.nationality,
      contact: customer.contact,
      address: customer.address,
      idType: customer.idType,
      idNumber: customer.idNumber,
      category: customer.category,
      remarks: customer.remarks || '',
    })

    setFormErrors({})
    setSelectedCustomer(null)
    setShowCustomerModal(true)
  }

  const saveCustomer = async () => {
    if (registrationPending.current || isSubmitting) {
      return
    }

    if (!validateForm()) {
      return
    }

    if (editingCustomer) {
      setCustomers((currentCustomers) =>
        currentCustomers.map((customer) =>
          customer.cid === editingCustomer.cid
            ? {
                ...customer,
                name: customerForm.fullName.trim(),
                initials: getInitials(customerForm.fullName),
                nationality: customerForm.nationality,
                contact: customerForm.contact.trim(),
                address: customerForm.address.trim(),
                idType: customerForm.idType,
                idNumber: customerForm.idNumber.trim(),
                category: customerForm.category,
                remarks: customerForm.remarks.trim(),
              }
            : customer,
        ),
      )

      showToast(`${customerForm.fullName.trim()} updated successfully.`)
    } else {
      registrationPending.current = true
      setIsSubmitting(true)
      setFormErrors({})

      try {
        const registeredCustomer = await registerCustomer({
          fullName: customerForm.fullName.trim(),
          phone: customerForm.contact.trim(),
          nationality: customerForm.nationality.trim(),
        })

        const newCustomer = mapBackendCustomer(registeredCustomer)
        directoryRequests.current.invalidate()
        setSearchTerm('')
        setNationalityFilter('ALL')

        setCustomers((currentCustomers) => [
          newCustomer,
          ...currentCustomers.filter(
            (customer) => customer.id !== newCustomer.id,
          ),
        ])
        showToast(
          `${newCustomer.name} created successfully as ${newCustomer.cid}.`,
        )
      } catch (error) {
        const status = error.response?.status ?? error.normalized?.status
        let message

        if (status === 409) {
          message = 'A customer with this phone number already exists.'
        } else if (status === 400) {
          message = getErrorMessage(error) || 'Please check the registration details.'
        } else if (status === 401) {
          message = 'Your session has expired. Please sign in again.'
        } else if (status === 403) {
          message = 'You are not authorized to register customers.'
        } else if (isNetworkError(error)) {
          message = 'The backend is unavailable. Please try again when the server is running.'
        } else {
          message = getErrorMessage(error) || 'Customer registration failed.'
        }

        setFormErrors({ submit: message })
        showToast(message, 'error')
        return
      } finally {
        registrationPending.current = false
        setIsSubmitting(false)
      }
    }

    setShowCustomerModal(false)
    setEditingCustomer(null)
    setCustomerForm(emptyCustomerForm)
    setFormErrors({})
  }

  const exportCustomers = () => {
    if (!directoryAvailable) return
    const csv = customerDirectoryCsv(filteredCustomers)

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `customers-directory-${viewMode.toLowerCase()}.csv`
    link.click()

    URL.revokeObjectURL(url)

    showToast('Customer directory exported successfully.')
  }

  const resetFilters = () => {
    setSearchTerm('')
    setNationalityFilter('ALL')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="space-y-5 p-4 sm:p-5 lg:p-6">
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rotate-45 bg-amber-400" />

              <h1 className="font-serif text-3xl font-black tracking-tight text-slate-950">
                Customers & KYC
              </h1>
            </div>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Permanent customer directory, identification records, visit
              history and role-based customer information.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                disabled={isSavingProfile} onClick={() => setViewMode('RECEPTION')}
                className={`rounded-lg px-4 py-2 text-sm font-black transition ${
                  viewMode === 'RECEPTION'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                Reception User
              </button>

              {canViewPrivileged && (
                <button
                  type="button"
                  disabled={isSavingProfile} onClick={() => setViewMode('DIRECTOR')}
                  className={`rounded-lg px-4 py-2 text-sm font-black transition ${
                    viewMode === 'DIRECTOR'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  Management View
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={!directoryAvailable || isSubmitting} onClick={openNewCustomerModal}
              className="h-11 rounded-xl bg-amber-400 px-5 text-sm font-black text-slate-950 shadow-sm transition hover:bg-amber-300"
            >
              ＋ New Customer
            </button>

            <button
              type="button"
              disabled={!directoryAvailable} onClick={exportCustomers}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              Excel / CSV
            </button>

            <button
              type="button"
              disabled title="Directory print is unavailable while scoped printing is not implemented"
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
            >
              Print
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Customers"
            value={summary.totalCustomers}
            description="Permanent customer records"
          />

          <SummaryCard
            label="Total Visits"
            value={summary.totalVisits}
            description="Lifetime session records, including open visits"
          />

          <SummaryCard
            label="VIP / VVIP"
            value={summary.vipCustomers}
            description="Not provided by the directory"
          />

          <SummaryCard
            label="Currently Displayed"
            value={directoryAvailable ? filteredCustomers.length : UNAVAILABLE}
            description="Records matching filters"
          />

          {isDirectorView && (
            <>
              <SummaryCard
                label="Lifetime Buy-In"
                value={summary.totalBuyIn}
                description="Customer financial totals are unavailable"
              />

              <SummaryCard
                label="Lifetime Cash-Out"
                value={summary.totalCashOut}
                description="Customer financial totals are unavailable"
              />

              <SummaryCard
                label="Customer Financial Summary"
                value={UNAVAILABLE}
                description="Customer financial totals are unavailable"
              />

              <SummaryCard
                label="Average Visits"
                value={UNAVAILABLE}
                description="Not calculated in this phase"
              />
            </>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.17em] text-slate-700">
                    Customer Master Directory
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Search and review permanent customer records.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-100"
                >
                  Reset Filters
                </button>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(320px,1fr)_180px_1fr]">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search customer name, CID, phone or nationality..."
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                />

                <select
                  value={nationalityFilter}
                  onChange={(event) =>
                    setNationalityFilter(event.target.value)
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                >
                  <option value="ALL">All Nationalities</option>
                  {[...new Set(customers.map((item) => item.nationality))].map(
                    (nationality) => (
                      <option key={nationality} value={nationality}>
                        {nationality}
                      </option>
                    ),
                  )}
                </select>

                <p className="self-center text-xs text-slate-500">Identity and category filters are unavailable in the directory.</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table
              className={`w-full border-collapse ${
                isDirectorView ? 'min-w-[1450px]' : 'min-w-[1150px]'
              }`}
            >
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-left">
                  <TableHeading text="Customer" />
                  <TableHeading text="CID" />
                  <TableHeading text="Nationality" />
                  <TableHeading text="Contact" />
                  <TableHeading text="ID Type" />
                  <TableHeading text="ID Number" />
                  <TableHeading text="Visits" />

                  {isDirectorView && (
                    <>
                      <TableHeading text="Lifetime Buy-In" />
                      <TableHeading text="Lifetime Cash-Out" />
                      <TableHeading text="Financial Summary" />
                    </>
                  )}

                  <TableHeading text="Category" />
                  <TableHeading text="Last Visit" />
                  <TableHeading text="Action" />
                </tr>
              </thead>

              <tbody>
                {!isLoadingCustomers && !customersError && filteredCustomers.map((customer) => {

                  return (
                    <tr
                      key={customer.cid}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-black text-amber-700">
                            {customer.initials}
                          </span>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-black text-slate-950">
                                {customer.name}
                              </p>

                              {customer.hasActiveSession && (
                                <span
                                  title={
                                    customer.activeSessionId
                                      ? `Active session ${customer.activeSessionId}`
                                      : 'Customer has an active session'
                                  }
                                  className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700"
                                >
                                  Currently inside
                                </span>
                              )}
                            </div>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {customer.category}
                            </p>
                          </div>
                        </div>
                      </td>

                      <TableCell value={customer.cid} mono />
                      <TableCell value={customer.nationality} />
                      <TableCell value={customer.contact} />
                      <TableCell value={customer.idType} />
                      <TableCell value={customer.idNumber} mono />
                      <TableCell value={customer.visits} />

                      {isDirectorView && (
                        <>
                          <TableCell
                            value={UNAVAILABLE}
                          />

                          <TableCell
                            value={UNAVAILABLE}
                          />

                          <td className="px-4 py-4 text-sm font-black text-slate-500">
                            Unavailable
                          </td>
                        </>
                      )}

                      <td className="px-4 py-4">
                        <CategoryBadge category={customer.category} />
                      </td>

                      <TableCell value={customer.lastVisit} />

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => openCustomerProfile(customer)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  )
                })}

                {isLoadingCustomers && (
                  <tr>
                    <td
                      colSpan={isDirectorView ? 13 : 10}
                      className="px-5 py-16 text-center text-sm font-black text-slate-700"
                    >
                      Loading customers...
                    </td>
                  </tr>
                )}

                {!isLoadingCustomers && customersError && (
                  <tr>
                    <td
                      colSpan={isDirectorView ? 13 : 10}
                      className="px-5 py-16 text-center"
                    >
                      <p className="text-sm font-black text-slate-700">
                        {customersError}
                      </p>
                      <button
                        type="button"
                        onClick={loadCustomers}
                        className="mt-3 text-sm font-black text-amber-700 hover:underline"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                )}

                {!isLoadingCustomers && !customersError && filteredCustomers.length === 0 && (
                  <tr>
                    <td
                      colSpan={isDirectorView ? 13 : 10}
                      className="px-5 py-16 text-center"
                    >
                      <p className="text-sm font-black text-slate-700">
                        {customers.length === 0
                          ? 'No customer records found.'
                          : 'No matching customers found.'}
                      </p>

                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-3 text-sm font-black text-amber-700 hover:underline"
                      >
                        Clear all filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {directoryAvailable
                ? `Showing ${filteredCustomers.length} of ${customers.length} customers`
                : isLoadingCustomers ? 'Loading customer directory…' : 'Customer directory unavailable'}
            </span>

            <span>
              View mode:{' '}
              <strong>
                {isDirectorView ? 'Management View' : 'Reception User'}
              </strong>
            </span>
          </div>
        </section>
      </main>

      {showCustomerModal && (
        <ModalOverlay onClose={() => !registrationPending.current && setShowCustomerModal(false)}>
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title={
                editingCustomer
                  ? 'Edit Customer Record'
                  : 'New Customer Registration'
              }
              description="Create or update the permanent customer master record."
              onClose={() => !registrationPending.current && setShowCustomerModal(false)}
            />

            <div className="max-h-[75vh] overflow-y-auto p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyField
                  label="CID"
                  value={
                    editingCustomer
                      ? editingCustomer.cid
                      : 'Generated automatically'
                  }
                />

                <InputField
                  label="Full Name"
                  required
                  value={customerForm.fullName}
                  placeholder="Enter customer full name"
                  error={formErrors.fullName}
                  onChange={(value) =>
                    setCustomerForm((current) => ({
                      ...current,
                      fullName: value,
                    }))
                  }
                />

                <SelectField
                  label="Nationality"
                  required
                  value={customerForm.nationality}
                  error={formErrors.nationality}
                  options={[
                    'Nepali',
                    'Indian',
                    'Chinese',
                    'British',
                    'UAE',
                    'American',
                    'Other',
                  ]}
                  onChange={(value) =>
                    setCustomerForm((current) => ({
                      ...current,
                      nationality: value,
                    }))
                  }
                />

                <InputField
                  label="Contact Number"
                  required
                  value={customerForm.contact}
                  placeholder="+977-98XXXXXXXX"
                  error={formErrors.contact}
                  onChange={(value) =>
                    setCustomerForm((current) => ({
                      ...current,
                      contact: value,
                    }))
                  }
                />

                {editingCustomer && (
                  <>
                    <div className="sm:col-span-2">
                      <InputField
                        label="Address"
                        required
                        value={customerForm.address}
                        placeholder="Street, city and country"
                        error={formErrors.address}
                        onChange={(value) =>
                          setCustomerForm((current) => ({
                            ...current,
                            address: value,
                          }))
                        }
                      />
                    </div>

                    <SelectField
                      label="ID Type"
                      required
                      value={customerForm.idType}
                      error={formErrors.idType}
                      options={[
                        'Citizenship',
                        'Passport',
                        'Aadhaar',
                        'Driving Licence',
                        'National ID',
                        'Other',
                      ]}
                      onChange={(value) =>
                        setCustomerForm((current) => ({
                          ...current,
                          idType: value,
                        }))
                      }
                    />

                    <InputField
                      label="ID Number"
                      required
                      value={customerForm.idNumber}
                      placeholder="Enter ID document number"
                      error={formErrors.idNumber}
                      onChange={(value) =>
                        setCustomerForm((current) => ({
                          ...current,
                          idNumber: value,
                        }))
                      }
                    />

                    <SelectField
                      label="Customer Category"
                      value={customerForm.category}
                      options={['Normal', 'Standard', 'VIP', 'VVIP']}
                      onChange={(value) =>
                        setCustomerForm((current) => ({
                          ...current,
                          category: value,
                        }))
                      }
                    />

                    <UploadBox
                      label="Customer Photo"
                      text="Capture or upload photo"
                    />

                    <UploadBox
                      label="ID Attachment"
                      text="Upload identification document"
                    />

                    <div className="sm:col-span-2">
                      <label className="block">
                        <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                          Remarks
                        </span>

                        <textarea
                          value={customerForm.remarks}
                          onChange={(event) =>
                            setCustomerForm((current) => ({
                              ...current,
                              remarks: event.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="Optional customer notes"
                          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                        />
                      </label>
                    </div>
                  </>
                )}

                {formErrors.submit && (
                  <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {formErrors.submit}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveCustomer}
                disabled={isSubmitting}
                className="rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? 'Saving...'
                  : editingCustomer
                    ? 'Save Changes'
                    : 'Save Customer'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {selectedCustomer && (
        <ModalOverlay onClose={closeCustomerProfile}>
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Customer Profile"
              description={isDirectorView ? 'Authorized customer KYC and classification view.' : 'Reception-safe customer KYC and visit information.'}
              onClose={closeCustomerProfile}
            />

            <div className="max-h-[78vh] space-y-5 overflow-y-auto p-5">
              <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl font-black text-amber-700">
                  {selectedCustomer.initials}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="text-2xl font-black text-slate-950">
                    {selectedCustomer.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedCustomer.cid} ·{' '}
                    {selectedCustomer.nationality}
                  </p>
                </div>

                {isDirectorView && privilegedProfile?.category && (
                  <CategoryBadge category={privilegedProfile.category} />
                )}
              </div>

              {isLoadingProfile && (
                <div className="rounded-xl border border-slate-200 p-10 text-center text-sm font-black text-slate-600">Loading customer profile...</div>
              )}

              {profileError && !isLoadingProfile && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {profileError}
                  <button type="button" onClick={() => loadCustomerProfile(selectedCustomer)} className="ml-3 font-black underline">Retry</button>
                </div>
              )}

              {customerProfile && !isLoadingProfile && (
                <>
                  <ProfileSection title="Basic customer information">
                    <DetailGrid fields={[
                      ['Customer code', customerProfile.customerCode],
                      ['Full name', customerProfile.fullName],
                      ['Phone', customerProfile.phone],
                      ['Nationality', customerProfile.nationality],
                      ['Customer status', customerProfile.status],
                      ['KYC status', customerProfile.kycStatus],
                    ]} />
                  </ProfileSection>

                  <ProfileSection title="KYC details" action={(
                    <button type="button" onClick={() => { setProfileAction('KYC'); setProfileActionError(null) }} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white">Edit KYC</button>
                  )}>
                    {profileAction === 'KYC' ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InputField label="Date of Birth" type="date" value={kycForm.dateOfBirth} onChange={(value) => setKycForm((current) => ({ ...current, dateOfBirth: value }))} />
                        <InputField label="Gender" value={kycForm.gender} onChange={(value) => setKycForm((current) => ({ ...current, gender: value }))} />
                        <InputField label="Email" type="email" value={kycForm.email} onChange={(value) => setKycForm((current) => ({ ...current, email: value }))} />
                        <InputField label="Occupation" value={kycForm.occupation} onChange={(value) => setKycForm((current) => ({ ...current, occupation: value }))} />
                        <InputField label="Permanent Address" value={kycForm.permanentAddress} onChange={(value) => setKycForm((current) => ({ ...current, permanentAddress: value }))} />
                        <InputField label="Current Address" value={kycForm.currentAddress} onChange={(value) => setKycForm((current) => ({ ...current, currentAddress: value }))} />
                        <ActionFeedback message={profileActionError} />
                        <FormActions saving={isSavingProfile} onCancel={() => { setProfileAction(null); setProfileActionError(null); applyKycForm(customerProfile) }} onSave={saveBasicKyc} />
                      </div>
                    ) : (
                      <DetailGrid fields={[
                        ['Date of birth', customerProfile.dateOfBirth],
                        ['Gender', customerProfile.gender],
                        ['Permanent address', customerProfile.permanentAddress],
                        ['Current address', customerProfile.currentAddress],
                        ['Email', customerProfile.email],
                        ['Occupation', customerProfile.occupation],
                      ]} />
                    )}
                  </ProfileSection>

                  <ProfileSection title="Visit information">
                    <DetailGrid fields={[
                      ['Total visits', safeNumber(customerProfile.totalVisits)],
                      ['Last visit business date', lastVisitLabel(customerProfile.totalVisits, customerProfile.lastVisitBusinessDate)],
                      ['Last entry time', formatDateTime(customerProfile.lastEntryTime)],
                      ['Currently inside', customerProfile.hasActiveSession ? 'Yes' : 'No'],
                      ['Active session', customerProfile.activeSessionId],
                    ]} />
                  </ProfileSection>

                  <ProfileSection title="Identity" action={(
                    <button type="button" onClick={() => { setProfileAction('IDENTITY'); setProfileActionError(null) }} className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-black text-slate-950">Add Identity Document</button>
                  )}>
                    {profileAction === 'IDENTITY' ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <SelectField label="Document Type" required value={identityForm.documentType} options={['PASSPORT', 'CITIZENSHIP', 'NATIONAL_ID', 'DRIVING_LICENCE', 'OTHER']} onChange={(value) => setIdentityForm((current) => ({ ...current, documentType: value }))} />
                        <InputField label="Document Number" required value={identityForm.documentNumber} onChange={(value) => setIdentityForm((current) => ({ ...current, documentNumber: value }))} />
                        <InputField label="Issuing Country" value={identityForm.issuingCountry} onChange={(value) => setIdentityForm((current) => ({ ...current, issuingCountry: value }))} />
                        <InputField label="Issue Date" type="date" value={identityForm.issuedDate} onChange={(value) => setIdentityForm((current) => ({ ...current, issuedDate: value }))} />
                        <InputField label="Expiry Date" type="date" value={identityForm.expiryDate} onChange={(value) => setIdentityForm((current) => ({ ...current, expiryDate: value }))} />
                        <label className="flex items-center gap-2 self-end rounded-lg border border-slate-200 px-3 py-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={identityForm.primaryDocument} onChange={(event) => setIdentityForm((current) => ({ ...current, primaryDocument: event.target.checked }))} /> Primary document</label>
                        <ActionFeedback message={profileActionError} />
                        <FormActions saving={isSavingProfile} onCancel={() => { setProfileAction(null); setProfileActionError(null); setIdentityForm(emptyIdentityForm) }} onSave={saveIdentityDocument} />
                      </div>
                    ) : (
                      <>
                        <DetailGrid fields={identityFields(customerProfile.primaryIdentityDocument)} />
                        <p className="mt-3 text-xs font-bold text-slate-500">{customerProfile.photoAvailable ? 'Photo available' : 'No photo uploaded'}</p>
                      </>
                    )}
                  </ProfileSection>

                  {isDirectorView && canViewPrivileged && privilegedProfile && (
                    <>
                      <ProfileSection title="Privileged classification" action={(
                        <button type="button" onClick={() => { setProfileAction('CLASSIFICATION'); setProfileActionError(null) }} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white">Edit Classification</button>
                      )}>
                        {profileAction === 'CLASSIFICATION' ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <SelectField label="Category" value={classificationForm.category} options={['NORMAL', 'VIP', 'VVIP']} onChange={(value) => setClassificationForm((current) => ({ ...current, category: value }))} />
                            <SelectField label="Risk Level" value={classificationForm.riskLevel} options={['LOW', 'MEDIUM', 'HIGH']} onChange={(value) => setClassificationForm((current) => ({ ...current, riskLevel: value }))} />
                            <label className="sm:col-span-2"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Internal Notes</span><textarea rows={4} maxLength={4000} value={classificationForm.internalNotes} onChange={(event) => setClassificationForm((current) => ({ ...current, internalNotes: event.target.value }))} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-400" /></label>
                            <ActionFeedback message={profileActionError} />
                            <FormActions saving={isSavingProfile} onCancel={() => { setProfileAction(null); setProfileActionError(null); applyClassificationForm(privilegedProfile) }} onSave={saveClassification} />
                          </div>
                        ) : (
                          <DetailGrid fields={[
                            ['Category', privilegedProfile.category],
                            ['Risk level', privilegedProfile.riskLevel],
                            ['Internal notes', privilegedProfile.internalNotes],
                            ['Created at', formatDateTime(privilegedProfile.createdAt)],
                            ['Updated at', formatDateTime(privilegedProfile.updatedAt)],
                          ]} />
                        )}
                      </ProfileSection>

                      <ProfileSection title="Identity document history">
                        <DocumentHistory documents={identityDocuments} />
                      </ProfileSection>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                onClick={closeCustomerProfile}
                disabled={isSavingProfile}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[200] max-w-sm rounded-xl border px-4 py-3 text-sm font-bold shadow-xl ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

const SummaryCard = ({ label, value, description }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
      {label}
    </p>

    <p className="mt-4 font-serif text-3xl font-black text-slate-950">
      {value}
    </p>

    <p className="mt-2 text-xs text-slate-500">{description}</p>
  </div>
)

const CategoryBadge = ({ category }) => {
  const styles = {
    Normal: 'border-sky-200 bg-sky-50 text-sky-700',
    Standard: 'border-slate-200 bg-slate-100 text-slate-700',
    VIP: 'border-amber-200 bg-amber-50 text-amber-700',
    VVIP: 'border-purple-200 bg-purple-50 text-purple-700',
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
        styles[category] || styles.Normal
      }`}
    >
      {category}
    </span>
  )
}

const TableHeading = ({ text }) => (
  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
    {text}
  </th>
)

const TableCell = ({ value, mono = false }) => (
  <td
    className={`px-4 py-4 text-sm text-slate-700 ${
      mono ? 'font-mono font-bold' : ''
    }`}
  >
    {value}
  </td>
)

const ModalOverlay = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    }}
  >
    {children}
  </div>
)

const ModalHeader = ({ title, description, onClose }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
    <div>
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rotate-45 bg-amber-400" />

        <h2 className="font-serif text-2xl font-black text-slate-950">
          {title}
        </h2>
      </div>

      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>

    <button
      type="button"
      onClick={onClose}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-100"
    >
      ×
    </button>
  </div>
)

const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  error,
}) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </span>

    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition ${
        error
          ? 'border-red-300 focus:border-red-500'
          : 'border-slate-200 focus:border-amber-400'
      }`}
    />

    {error && (
      <span className="mt-1 block text-xs font-semibold text-red-600">
        {error}
      </span>
    )}
  </label>
)

const SelectField = ({
  label,
  value,
  onChange,
  options,
  required,
  error,
}) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </span>

    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition ${
        error
          ? 'border-red-300 focus:border-red-500'
          : 'border-slate-200 focus:border-amber-400'
      }`}
    >
      <option value="">Select</option>

      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>

    {error && (
      <span className="mt-1 block text-xs font-semibold text-red-600">
        {error}
      </span>
    )}
  </label>
)

const ReadOnlyField = ({ label, value }) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
      {label}
    </span>

    <input
      readOnly
      value={value}
      className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500 outline-none"
    />
  </label>
)

const UploadBox = ({ label, text }) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
      {label}
    </span>

    <span className="flex h-10 cursor-pointer items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-sm font-bold text-slate-600 transition hover:border-amber-400 hover:bg-amber-50">
      ↑ {text}
    </span>

    <input type="file" className="hidden" />
  </label>
)

const DetailCard = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
      {label}
    </p>

    <p className="mt-2 break-words text-sm font-black text-slate-900">
      {value}
    </p>
  </div>
)

const ProfileSection = ({ title, action, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-4">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-700">{title}</h3>
      {action}
    </div>
    {children}
  </section>
)

const DetailGrid = ({ fields }) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {fields.map(([label, value]) => (
      <DetailCard key={label} label={label} value={displayValue(value)} />
    ))}
  </div>
)

const ActionFeedback = ({ message }) => message ? (
  <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</div>
) : null

const FormActions = ({ saving, onCancel, onSave }) => (
  <div className="flex justify-end gap-2 sm:col-span-2">
    <button type="button" disabled={saving} onClick={onCancel} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-60">Cancel</button>
    <button type="button" disabled={saving} onClick={onSave} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
  </div>
)

const DocumentHistory = ({ documents }) => {
  if (!documents.length) {
    return <p className="text-sm font-semibold text-slate-500">No identity document history.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1200px] w-full border-collapse text-left text-xs">
        <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-wide text-slate-500">
          <tr>{['Type', 'Document number', 'Country', 'Issued', 'Expiry', 'Primary', 'Status', 'Created by', 'Created at', 'Verified by', 'Verified at', 'Updated at'].map((heading) => <th key={heading} className="border-b border-slate-200 px-3 py-2">{heading}</th>)}</tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id} className="border-b border-slate-100 text-slate-700">
              <td className="px-3 py-3 font-bold">{displayValue(document.documentType)}</td>
              <td className="px-3 py-3 font-mono">{displayValue(document.documentNumber)}</td>
              <td className="px-3 py-3">{displayValue(document.issuingCountry)}</td>
              <td className="px-3 py-3">{displayValue(document.issuedDate)}</td>
              <td className="px-3 py-3">{displayValue(document.expiryDate)}</td>
              <td className="px-3 py-3">{document.primaryDocument ? 'Yes' : 'No'}</td>
              <td className="px-3 py-3">{displayValue(document.status)}</td>
              <td className="px-3 py-3">{displayValue(document.createdBy?.username)}</td>
              <td className="px-3 py-3">{formatDateTime(document.createdAt)}</td>
              <td className="px-3 py-3">{displayValue(document.verifiedBy?.username)}</td>
              <td className="px-3 py-3">{formatDateTime(document.verifiedAt)}</td>
              <td className="px-3 py-3">{formatDateTime(document.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const identityFields = (document) => document ? [
  ['Document type', document.documentType],
  ['Document number', document.documentNumber],
  ['Issuing country', document.issuingCountry],
  ['Issue date', document.issuedDate],
  ['Expiry date', document.expiryDate],
  ['Document status', document.status],
] : [['Primary identity document', 'No active primary identity document']]

const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

const safeNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? Math.trunc(number) : 0
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString()
}

const formatNpr = (value) =>
  `NPR ${Number(value).toLocaleString('en-IN')}`

const formatSignedNpr = (value) =>
  `${value >= 0 ? '+' : '-'} NPR ${Math.abs(value).toLocaleString(
    'en-IN',
  )}`

const formatCompactNpr = (value) => {
  if (Math.abs(value) >= 10000000) {
    return `NPR ${(value / 10000000).toFixed(2)} Cr`
  }

  if (Math.abs(value) >= 100000) {
    return `NPR ${(value / 100000).toFixed(2)} L`
  }

  return formatNpr(value)
}

const getInitials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

export default CustomersKyc
