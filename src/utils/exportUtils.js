export function formatCsvValue(value) {
  if (value === null || value === undefined) return ''

  const normalizedValue =
    typeof value === 'object' ? JSON.stringify(value) : String(value)
  const shouldEscape =
    normalizedValue.includes(',') ||
    normalizedValue.includes('"') ||
    normalizedValue.includes('\n') ||
    normalizedValue.includes('\r')

  if (!shouldEscape) return normalizedValue

  return `"${normalizedValue.replace(/"/g, '""')}"`
}

export function buildCsvFromRows(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return ''

  const headers = Object.keys(rows[0])
  const headerRow = headers.map(formatCsvValue).join(',')
  const dataRows = rows.map((row) =>
    headers.map((header) => formatCsvValue(row[header])).join(',')
  )

  return [headerRow, ...dataRows].join('\n')
}

export function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
  if (!content) return false

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return true
}

export function exportToCsv(filename, rows = []) {
  const csv = buildCsvFromRows(rows)
  if (!csv) return false

  return downloadTextFile(filename, csv, 'text/csv;charset=utf-8')
}
