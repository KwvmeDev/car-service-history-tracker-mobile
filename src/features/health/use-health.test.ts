import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/generated/client', () => ({ api: { GET: vi.fn() } }))

const { api } = await import('@/api/generated/client')
const { useHealth } = await import('./use-health')
const { renderHook, waitFor } = await import('@testing-library/react-native')

const get = vi.mocked(api.GET)

afterEach(() => {
  vi.clearAllMocks()
})

describe('useHealth', () => {
  it('starts in loading', () => {
    get.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useHealth())

    expect(result.current.phase).toBe('loading')
  })

  it('resolves to loaded with the payload when status is ok', async () => {
    get.mockResolvedValue({ data: { status: 'ok', version: '0.1.0', time: '2026-01-01T00:00:00Z' } })
    const { result } = renderHook(() => useHealth())

    await waitFor(() => {
      expect(result.current.phase).toBe('loaded')
    })
    if (result.current.phase === 'loaded') {
      expect(result.current.version).toBe('0.1.0')
    }
  })

  it('resolves to degraded when the api returns a non-ok status', async () => {
    get.mockResolvedValue({ data: { status: 'starting', version: '0.1.0', time: 't' } })
    const { result } = renderHook(() => useHealth())

    await waitFor(() => {
      expect(result.current.phase).toBe('degraded')
    })
  })

  it('resolves to error when the request fails', async () => {
    get.mockResolvedValue({ error: { message: 'boom' } })
    const { result } = renderHook(() => useHealth())

    await waitFor(() => {
      expect(result.current.phase).toBe('error')
    })
  })
})
