import { Card, Skeleton, Statistic } from 'antd'
import { useTranslation } from 'react-i18next'

import type { TaskSummary } from '../../api/types'

export function TaskSummaryCards({ summary }: { summary: TaskSummary | undefined }) {
  const { t } = useTranslation()
  const items = [
    { key: 'total', label: t('tasks.total'), value: summary?.total },
    { key: 'todo', label: t('tasks.status.todo'), value: summary?.todo },
    { key: 'in_progress', label: t('tasks.status.in_progress'), value: summary?.in_progress },
    { key: 'done', label: t('tasks.status.done'), value: summary?.done },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.key} size="small">
          {item.value === undefined ? (
            <Skeleton active paragraph={false} />
          ) : (
            <Statistic title={item.label} value={item.value} />
          )}
        </Card>
      ))}
    </div>
  )
}
