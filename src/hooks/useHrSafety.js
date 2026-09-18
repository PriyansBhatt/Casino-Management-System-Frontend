import { useEffect, useMemo, useRef } from 'react'
import useAuth from './useAuth'
import { createHrSafety } from '../utils/hrSafety'
export const hrActorKey = user => `${user?.id || user?.username || ''}:${user?.role || ''}`
export default function useHrSafety() {
  const { user } = useAuth()
  const actor = hrActorKey(user), current = useRef(actor)
  current.current = actor
  const safety = useMemo(() => createHrSafety(() => current.current === actor && !!user && ['DIRECTOR', 'SUPER_ADMIN'].includes(user.role)), [actor])
  useEffect(() => { safety.mount(); return () => safety.dispose() }, [safety])
  return safety
}
