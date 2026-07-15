export const formatDate = (date, format = 'MM/DD/YYYY') => {
  if (!date) return ''

  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  const formats = {
    'MM/DD/YYYY': `${month}/${day}/${year}`,
    'DD/MM/YYYY': `${day}/${month}/${year}`,
    'YYYY-MM-DD': `${year}-${month}-${day}`,
    'DD-MM-YYYY': `${day}-${month}-${year}`,
    'MM/DD/YYYY HH:mm': `${month}/${day}/${year} ${hours}:${minutes}`,
    'DD/MM/YYYY HH:mm': `${day}/${month}/${year} ${hours}:${minutes}`,
    'YYYY-MM-DD HH:mm:ss': `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
  }

  return formats[format] || formats['MM/DD/YYYY']
}

export const formatTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export default formatDate
