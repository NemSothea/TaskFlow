import { useCallback, useEffect, useState } from 'react'

import { type ApiError, parseApiError } from '../../api/errors'

interface AsyncState<T> {
  data: T | undefined
  error: ApiError | null
  loading: boolean
}

/**
 * Run `fetcher` whenever `deps` change. The previous request is aborted, so a
 * slow stale response can never overwrite a newer one. `data` is kept while
 * reloading so the UI does not flash empty.
 */
export function useAsync<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, error: null, loading: true })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))
    fetcher(controller.signal).then(
      (data) => setState({ data, error: null, loading: false }),
      (err: unknown) => {
        const error = parseApiError(err)
        if (error.canceled || controller.signal.aborted) return
        setState((s) => ({ ...s, error, loading: false }))
      },
    )
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls deps
  }, [...deps, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])
  return { ...state, reload }
}
