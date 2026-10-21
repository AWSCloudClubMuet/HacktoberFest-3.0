export class ApiError extends Error {
  status: number
  data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface RequestOptions extends RequestInit {
  timeoutMs?: number
  params?: Record<string, string | number | boolean | undefined | null>
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 8000, params, headers, ...customConfig } = options

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    signal: controller.signal,
  }

  try {
    const response = await fetch(url, config)
    clearTimeout(timer)

    if (!response.ok) {
      let errorBody: unknown
      try {
        errorBody = await response.json()
      } catch {
        errorBody = await response.text()
      }
      throw new ApiError(
        typeof errorBody === 'object' && errorBody && 'message' in errorBody
          ? String((errorBody as { message: unknown }).message)
          : `HTTP error ${response.status}: ${response.statusText}`,
        response.status,
        errorBody,
      )
    }

    if (response.status === 204) {
      return {} as T
    }

    return (await response.json()) as T
  } catch (error) {
    clearTimeout(timer)
    if (error instanceof ApiError) {
      throw error
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timed out after 8 seconds', 408)
    }
    if (error instanceof Error) {
      throw new ApiError(error.message, 0)
    }
    throw new ApiError('An unknown network error occurred', 0)
  }
}
