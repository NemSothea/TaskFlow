import { describe, expect, it } from 'vitest'

import { hasActiveFilters, paramsFromQuery, queryFromParams } from './query'

describe('queryFromParams', () => {
  it('returns defaults for empty params', () => {
    expect(queryFromParams(new URLSearchParams())).toEqual({
      page: 1,
      search: undefined,
      status: undefined,
      priority: undefined,
      ordering: '-created_at',
    })
  })

  it('drops invalid values from the URL', () => {
    const q = queryFromParams(
      new URLSearchParams('page=-3&status=archived&priority=urgent&ordering=password'),
    )
    expect(q.page).toBe(1)
    expect(q.status).toBeUndefined()
    expect(q.priority).toBeUndefined()
    expect(q.ordering).toBe('-created_at')
  })

  it('round-trips a valid query', () => {
    const params = new URLSearchParams('page=2&search=ទិញ&status=done&priority=high&ordering=title')
    expect(paramsFromQuery(queryFromParams(params)).toString()).toBe(params.toString())
  })
})

describe('hasActiveFilters', () => {
  it('ignores page and ordering', () => {
    expect(hasActiveFilters({ page: 3, ordering: 'title' })).toBe(false)
    expect(hasActiveFilters({ status: 'todo' })).toBe(true)
  })
})
