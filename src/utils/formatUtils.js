export const formatNpr = (value) => `NPR ${Number(value || 0).toLocaleString()}`

export const formatBusinessDate = (value) => value || 'Not available'
