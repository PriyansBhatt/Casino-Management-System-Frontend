import { ROLES } from '../constants/roles'
import ROUTE_PERMISSIONS from '../constants/routePermissions'

const routePatternMatches = (pattern, pathname) => {
  const patternSegments = pattern.split('/').filter(Boolean)
  const pathSegments = pathname.split('/').filter(Boolean)

  if (patternSegments.length !== pathSegments.length) {
    return false
  }

  return patternSegments.every((segment, index) => {
    return segment.startsWith(':') || segment === pathSegments[index]
  })
}

const RECEPTIONIST_ROUTE_PATTERNS = [
  '/reception',
  '/reception/gate',
  '/reception/register',
  '/reception/customer/:id',
  '/reception/customer/:id/edit',
  '/customers',
  '/customers/kyc',
  '/customers/register',
  '/customers/:id',
  '/customers/:id/edit',
]

const isReceptionistRoute = (pathname) =>
  RECEPTIONIST_ROUTE_PATTERNS.some((pattern) =>
    routePatternMatches(pattern, pathname)
  )

const getAllowedRolesForPath = (pathname) => {
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname]
  }

  const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find((routePattern) =>
    routePatternMatches(routePattern, pathname)
  )

  return matchedRoute ? ROUTE_PERMISSIONS[matchedRoute] : null
}

export function hasRole(user, roles) {
  if (!user) {
    return false
  }

  if (user.role === ROLES.SUPER_ADMIN) {
    return true
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles]

  return allowedRoles.includes(user.role)
}

export function canAccessRoute(user, pathname) {
  if (!user) {
    return false
  }

  if (user.role === ROLES.SUPER_ADMIN) {
    return true
  }

  if (user.role === ROLES.RECEPTIONIST) {
    return isReceptionistRoute(pathname)
  }

  const allowedRoles = getAllowedRolesForPath(pathname)

  if (!allowedRoles) {
    return false
  }

  return hasRole(user, allowedRoles)
}

export function getDefaultRouteForRole(role) {
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.DIRECTOR:
    case ROLES.ADMIN:
      return '/dashboard'
    case ROLES.RECEPTIONIST:
      return '/reception'
    case ROLES.CASHIER:
      return '/cashier/buy-in'
    case ROLES.PIT_BOSS:
      return '/pit/tables'
    case ROLES.STORE_KEEPER:
      return '/store/department-requests'
    case ROLES.PROCUREMENT:
      return '/procurement/list'
    case ROLES.ACCOUNTS:
      return '/accounts/bills'
    case ROLES.DEPARTMENT_HEAD:
      return '/department/my-requests'
    case ROLES.AUDITOR:
      return '/audit-logs'
    default:
      return '/dashboard'
  }
}
