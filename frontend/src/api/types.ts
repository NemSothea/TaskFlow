// Mirrors the DRF serializers in backend/accounts and backend/tasks.

export interface User {
  id: number
  username: string
  email: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export const TASK_STATUSES: readonly TaskStatus[] = ['todo', 'in_progress', 'done']
export const TASK_PRIORITIES: readonly TaskPriority[] = ['low', 'medium', 'high']

export interface Task {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  /** ISO date (YYYY-MM-DD) or null */
  due_date: string | null
  created_at: string
  updated_at: string
}

export type TaskInput = Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date'>

export type TaskOrdering =
  | '-created_at'
  | 'created_at'
  | 'due_date'
  | '-due_date'
  | 'title'
  | '-title'

export interface TaskQuery {
  page?: number
  page_size?: number
  search?: string
  status?: TaskStatus
  priority?: TaskPriority
  ordering?: TaskOrdering
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type TaskSummary = Record<TaskStatus, number> & { total: number }

/** GET /tasks/stats/ - chart data for the dashboard. */
export interface TaskStats {
  /** Ordered high -> low. */
  by_priority: (Record<TaskStatus, number> & { priority: TaskPriority })[]
  /** The last 8 weeks, oldest first; `week_start` is a Monday (YYYY-MM-DD). */
  created_per_week: { week_start: string; count: number }[]
  /** Open (not done) tasks past their due date. */
  overdue: number
  /** Open tasks due from today through Sunday. */
  due_this_week: number
}

export interface LoginInput {
  username: string
  password: string
}

export interface RegisterInput extends LoginInput {
  email: string
}

export interface LoginResponse {
  access: string
  user: User
}
