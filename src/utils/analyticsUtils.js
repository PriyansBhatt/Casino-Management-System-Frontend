export function calculatePercentageChange(current, previous) {
  const currentValue = Number(current) || 0
  const previousValue = Number(previous) || 0

  if (previousValue === 0) return currentValue === 0 ? 0 : 100

  return ((currentValue - previousValue) / Math.abs(previousValue)) * 100
}

export function calculateTotalAmount(items = [], amountKey = 'amount') {
  return items.reduce((sum, item) => sum + (Number(item?.[amountKey]) || 0), 0)
}

export function groupByBusinessDate(items = []) {
  return groupByField(items, 'businessDate')
}

export function groupByField(items = [], field) {
  return items.reduce((groups, item) => {
    const key = item?.[field] || 'Not available'
    return {
      ...groups,
      [key]: [...(groups[key] || []), item],
    }
  }, {})
}

export function sortByAmountDesc(items = [], amountKey = 'amount') {
  return [...items].sort(
    (first, second) => (Number(second?.[amountKey]) || 0) - (Number(first?.[amountKey]) || 0)
  )
}

export function getKpiStatusVariant(value, type) {
  const numericValue = Number(value) || 0

  if (type === 'RISK' || type === 'AUDIT') {
    if (numericValue > 10) return 'danger'
    if (numericValue > 0) return 'warning'
    return 'success'
  }

  if (type === 'STOCK') {
    if (numericValue <= 0) return 'danger'
    if (numericValue <= 5) return 'warning'
    return 'success'
  }

  if (type === 'FINANCIAL') {
    if (numericValue < 0) return 'danger'
    if (numericValue === 0) return 'default'
    return 'success'
  }

  if (type === 'APPROVAL') {
    return numericValue > 0 ? 'warning' : 'success'
  }

  return numericValue > 0 ? 'info' : 'default'
}
