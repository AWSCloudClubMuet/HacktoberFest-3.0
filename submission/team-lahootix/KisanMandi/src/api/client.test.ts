import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient, ApiError } from './client'

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('instantiates ApiError with status and data', () => {
    const error = new ApiError('Not found', 404, { code: 'NOT_FOUND' })
    expect(error.message).toBe('Not found')
    expect(error.status).toBe(404)
    expect(error.data).toEqual({ code: 'NOT_FOUND' })
  })

  it('fetches JSON successfully', async () => {
    const mockData = [{ id: 1, name: 'Wheat' }]
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    }) as unknown as typeof fetch

    const result = await apiClient('/crops')
    expect(result).toEqual(mockData)
  })

  it('handles query parameters properly', async () => {
    let requestedUrl = ''
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      requestedUrl = String(url)
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [],
      })
    }) as unknown as typeof fetch

    await apiClient('/prices', { params: { crop_id: 1, _sort: 'date' } })
    expect(requestedUrl).toContain('crop_id=1')
    expect(requestedUrl).toContain('_sort=date')
  })

  it('throws ApiError on HTTP failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ message: 'Server crash' }),
    }) as unknown as typeof fetch

    await expect(apiClient('/crops')).rejects.toThrow('Server crash')
  })
})
