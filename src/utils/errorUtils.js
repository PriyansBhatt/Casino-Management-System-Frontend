export function getErrorMessage(error) {
  if (!error) return 'Something went wrong.'
  if (typeof error === 'string') return error
  if (error.response?.data?.message) return error.response.data.message
  if (error.response?.data?.error) return error.response.data.error
  if (error.message) return error.message
  return 'Something went wrong.'
}

export function isNetworkError(error) {
  return Boolean(error?.isAxiosError && !error.response)
}

export function normalizeApiError(error) {
  return {
    message: getErrorMessage(error),
    status: error?.response?.status || null,
    code: error?.code || null,
    isNetworkError: isNetworkError(error),
    details: error?.response?.data || null,
  }
}
