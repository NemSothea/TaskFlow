import { api } from './client'
import type { Paginated, Task, TaskInput, TaskQuery, TaskSummary } from './types'

export async function listTasks(query: TaskQuery, signal?: AbortSignal) {
  const { data } = await api.get<Paginated<Task>>('/tasks/', { params: query, signal })
  return data
}

export async function getTaskSummary(signal?: AbortSignal) {
  const { data } = await api.get<TaskSummary>('/tasks/summary/', { signal })
  return data
}

export async function createTask(input: TaskInput) {
  const { data } = await api.post<Task>('/tasks/', input)
  return data
}

export async function updateTask(id: number, input: Partial<TaskInput>) {
  const { data } = await api.patch<Task>(`/tasks/${id}/`, input)
  return data
}

export async function deleteTask(id: number) {
  await api.delete(`/tasks/${id}/`)
}
