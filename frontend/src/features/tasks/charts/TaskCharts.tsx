import { Alert, Button, Card, Skeleton } from 'antd'
import { useTranslation } from 'react-i18next'

import type { TaskStats, TaskSummary } from '../../../api/types'
import { PriorityChart } from './PriorityChart'
import { StatusChart } from './StatusChart'
import { WeeklyChart } from './WeeklyChart'

interface Props {
  summary: TaskSummary | undefined
  stats: TaskStats | undefined
  loading: boolean
  failed: boolean
  onRetry: () => void
}

export function TaskCharts({ summary, stats, loading, failed, onRetry }: Props) {
  const { t } = useTranslation()

  if (failed && !stats) {
    return (
      <Alert
        type="warning"
        showIcon
        title={t('tasks.charts.loadFailed')}
        action={
          <Button size="small" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        }
      />
    )
  }

  // Nothing to chart for a brand-new account; the empty state below says what to do.
  if (summary?.total === 0) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {summary ? (
        <StatusChart summary={summary} stats={stats} stale={loading} />
      ) : (
        <Card>
          <Skeleton active />
        </Card>
      )}
      {stats ? (
        <>
          <PriorityChart stats={stats} stale={loading} />
          <div className="md:col-span-2 xl:col-span-1">
            <WeeklyChart stats={stats} stale={loading} />
          </div>
        </>
      ) : (
        <>
          <Card>
            <Skeleton active />
          </Card>
          <Card className="md:col-span-2 xl:col-span-1">
            <Skeleton active />
          </Card>
        </>
      )}
    </div>
  )
}
