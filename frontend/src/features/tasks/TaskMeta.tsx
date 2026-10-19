import { Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import type { Task, TaskPriority, TaskStatus } from '../../api/types'

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: 'default',
  in_progress: 'processing',
  done: 'success',
}

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: 'green',
  medium: 'gold',
  high: 'red',
}

export function StatusTag({ status }: { status: TaskStatus }) {
  const { t } = useTranslation()
  return <Tag color={STATUS_COLOR[status]}>{t(`tasks.status.${status}`)}</Tag>
}

export function PriorityTag({ priority }: { priority: TaskPriority }) {
  const { t } = useTranslation()
  return <Tag color={PRIORITY_COLOR[priority]}>{t(`tasks.priority.${priority}`)}</Tag>
}

function isOverdue(task: Task): boolean {
  return task.status !== 'done' && !!task.due_date && dayjs(task.due_date).isBefore(dayjs(), 'day')
}

export function DueDate({ task }: { task: Task }) {
  const { t } = useTranslation()
  if (!task.due_date) return <Typography.Text type="secondary">—</Typography.Text>
  const overdue = isOverdue(task)
  return (
    <Typography.Text type={overdue ? 'danger' : undefined}>
      <time dateTime={task.due_date}>{dayjs(task.due_date).format('ll')}</time>
      {overdue && <span className="ms-1">({t('tasks.overdue')})</span>}
    </Typography.Text>
  )
}
