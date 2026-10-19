import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskOrdering,
  type TaskPriority,
  type TaskQuery,
  type TaskStatus,
} from '../../api/types'

export const PAGE_SIZE = 10

export const ORDERINGS = [
  { value: '-created_at', labelKey: 'tasks.ordering.newest' },
  { value: 'created_at', labelKey: 'tasks.ordering.oldest' },
  { value: 'due_date', labelKey: 'tasks.ordering.dueSoonest' },
  { value: '-due_date', labelKey: 'tasks.ordering.dueLatest' },
  { value: 'title', labelKey: 'tasks.ordering.titleAsc' },
  { value: '-title', labelKey: 'tasks.ordering.titleDesc' },
] as const satisfies readonly { value: TaskOrdering; labelKey: string }[]

const DEFAULT_ORDERING: TaskOrdering = '-created_at'

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined
}

/** Parse untrusted URL search params into a valid TaskQuery. */
export function queryFromParams(params: URLSearchParams): Required<Pick<TaskQuery, 'page' | 'ordering'>> &
  TaskQuery {
  const page = Number(params.get('page'))
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    search: params.get('search')?.trim() || undefined,
    status: oneOf<TaskStatus>(params.get('status'), TASK_STATUSES),
    priority: oneOf<TaskPriority>(params.get('priority'), TASK_PRIORITIES),
    ordering:
      oneOf<TaskOrdering>(
        params.get('ordering'),
        ORDERINGS.map((o) => o.value),
      ) ?? DEFAULT_ORDERING,
  }
}

/** Serialize a TaskQuery back to URL params, omitting defaults to keep URLs short. */
export function paramsFromQuery(query: TaskQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.page && query.page > 1) params.set('page', String(query.page))
  if (query.search) params.set('search', query.search)
  if (query.status) params.set('status', query.status)
  if (query.priority) params.set('priority', query.priority)
  if (query.ordering && query.ordering !== DEFAULT_ORDERING) params.set('ordering', query.ordering)
  return params
}

export function hasActiveFilters(query: TaskQuery): boolean {
  return Boolean(query.search || query.status || query.priority)
}
