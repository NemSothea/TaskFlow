import MockAdapter from 'axios-mock-adapter'

import { api } from '../api/client'

/**
 * Mock HTTP on the shared axios instance, so the real client (interceptors,
 * token refresh, error parsing) runs in tests. Call `.restore()` in afterEach.
 */
export function mockApi() {
  return new MockAdapter(api)
}
