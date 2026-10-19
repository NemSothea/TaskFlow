import { AxiosError, AxiosHeaders, CanceledError } from 'axios'
import { describe, expect, it } from 'vitest'

import { parseApiError } from './errors'

function axiosErrorWith(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('fail', 'ERR', config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  })
}

describe('parseApiError', () => {
  it('splits DRF detail and field errors', () => {
    const result = parseApiError(
      axiosErrorWith(400, { detail: 'Bad', title: ['Required.'], email: 'Taken.' }),
    )
    expect(result).toEqual({
      status: 400,
      message: 'Bad',
      fieldErrors: { title: ['Required.'], email: ['Taken.'] },
      canceled: false,
    })
  })

  it('treats a missing response as a network error', () => {
    const err = new AxiosError('Network Error', 'ERR_NETWORK')
    expect(parseApiError(err).status).toBeNull()
  })

  it('flags cancellations', () => {
    expect(parseApiError(new CanceledError()).canceled).toBe(true)
  })
})
