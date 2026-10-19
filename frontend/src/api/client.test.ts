import MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api, refreshAccessToken, setAccessToken, setSessionExpiredHandler } from './client'

let mock: MockAdapter

beforeEach(() => {
  mock = new MockAdapter(api)
  setAccessToken('old-access')
})

afterEach(() => {
  mock.restore()
  setSessionExpiredHandler(null)
  setAccessToken(null)
})

describe('api client', () => {
  it('attaches the bearer token', async () => {
    mock.onGet('/tasks/').reply((config) => [200, { auth: config.headers?.Authorization }])
    const { data } = await api.get('/tasks/')
    expect(data.auth).toBe('Bearer old-access')
  })

  it('refreshes once on 401 and retries the request', async () => {
    mock.onPost('/auth/refresh/').replyOnce(200, { access: 'new-access' })
    mock
      .onGet('/tasks/')
      .replyOnce(401)
      .onGet('/tasks/')
      .reply((config) => [200, { auth: config.headers?.Authorization }])

    const { data } = await api.get('/tasks/')
    expect(data.auth).toBe('Bearer new-access')
  })

  it('shares one refresh between concurrent callers', async () => {
    mock.onPost('/auth/refresh/').reply(200, { access: 'new-access' })
    await Promise.all([refreshAccessToken(), refreshAccessToken(), refreshAccessToken()])
    expect(mock.history.post.filter((r) => r.url === '/auth/refresh/')).toHaveLength(1)
  })

  it('signals session expiry when refresh fails', async () => {
    const expired = vi.fn()
    setSessionExpiredHandler(expired)
    mock.onGet('/tasks/').reply(401)
    mock.onPost('/auth/refresh/').reply(401)

    await expect(api.get('/tasks/')).rejects.toBeDefined()
    expect(expired).toHaveBeenCalledOnce()
  })

  it('does not try to refresh for auth endpoints', async () => {
    mock.onPost('/auth/login/').reply(401)
    await expect(api.post('/auth/login/', {}, { skipAuthRefresh: true })).rejects.toBeDefined()
    expect(mock.history.post.some((r) => r.url === '/auth/refresh/')).toBe(false)
  })
})
