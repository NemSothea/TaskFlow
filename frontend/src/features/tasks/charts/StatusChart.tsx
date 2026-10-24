import { ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { Tooltip, Typography, theme } from 'antd'
import * as m from 'motion/react-m'
import { useTranslation } from 'react-i18next'

import type { TaskStats, TaskStatus, TaskSummary } from '../../../api/types'
import { transitions } from '../../../lib/motion'
import { ChartCard, ChartTable } from './ChartCard'
import { useChartColors } from './colors'
import { percentOf } from './scale'

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']

interface Props {
  summary: TaskSummary
  stats: TaskStats | undefined
  stale: boolean
}

/** One bar per status, scaled to the total, plus the two deadline counts. */
export function StatusChart({ summary, stats, stale }: Props) {
  const { t } = useTranslation()
  const { token } = theme.useToken()
  const colors = useChartColors()

  const rows = STATUSES.map((status) => ({
    status,
    label: t(`tasks.status.${status}`),
    value: summary[status],
    percent: percentOf(summary[status], summary.total),
  }))
  // Longest bar fills the track; the percentage label carries the share of the total.
  const max = Math.max(1, ...rows.map((row) => row.value))

  return (
    <ChartCard title={t('tasks.charts.statusTitle')} extra={t('tasks.charts.total', { count: summary.total })} stale={stale}>
      <div aria-hidden className="flex flex-col gap-4">
        {rows.map((row, index) => (
          <div key={row.status} className="flex items-center gap-3">
            <Typography.Text type="secondary" className="w-24 shrink-0" ellipsis>
              {row.label}
            </Typography.Text>
            <div className="h-5 min-w-0 flex-1">
              <Tooltip title={`${row.label}: ${row.value} (${row.percent}%)`}>
                <m.div
                  className="h-full"
                  style={{
                    width: `${(row.value / max) * 100}%`,
                    background: colors[row.status],
                    borderRadius: '0 4px 4px 0',
                    originX: 0,
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ ...transitions.enter, duration: 0.7, delay: 0.2 + index * 0.08 }}
                />
              </Tooltip>
            </div>
            <span className="w-16 shrink-0 text-end tabular-nums">
              <Typography.Text strong>{row.value}</Typography.Text>{' '}
              <Typography.Text type="secondary" className="text-xs">
                {row.percent}%
              </Typography.Text>
            </span>
          </div>
        ))}
      </div>

      {stats && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            { key: 'overdue', icon: <ExclamationCircleOutlined />, color: token.colorError, bg: token.colorErrorBg, label: t('tasks.overdue'), value: stats.overdue },
            { key: 'due', icon: <ClockCircleOutlined />, color: token.colorWarning, bg: token.colorWarningBg, label: t('tasks.charts.dueThisWeek'), value: stats.due_this_week },
          ].map((stat) => (
            <div
              key={stat.key}
              className="flex items-center gap-3 p-3"
              style={{ background: token.colorFillQuaternary, borderRadius: token.borderRadiusLG }}
            >
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center"
                style={{ color: stat.color, background: stat.bg, borderRadius: token.borderRadius }}
              >
                {stat.icon}
              </span>
              <span className="flex min-w-0 flex-col">
                <Typography.Text type="secondary" className="text-xs leading-tight">
                  {stat.label}
                </Typography.Text>
                <span className="text-xl font-semibold leading-tight">{stat.value}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <ChartTable
        caption={t('tasks.charts.statusTitle')}
        headers={[t('tasks.fields.status'), t('tasks.charts.tasksCount'), '%']}
        rows={rows.map((row) => [row.label, row.value, `${row.percent}%`])}
      />
    </ChartCard>
  )
}
