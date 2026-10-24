import { Tooltip, Typography } from 'antd'
import * as m from 'motion/react-m'
import { useTranslation } from 'react-i18next'

import type { TaskStats, TaskStatus } from '../../../api/types'
import { transitions } from '../../../lib/motion'
import { ChartCard, ChartTable } from './ChartCard'
import { inkOn, useChartColors } from './colors'

// Stack and legend order. Adjacent pairs (orange|blue, blue|aqua) are the validated ones.
const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']

/** Below this share of the row a segment is too narrow for its number; the tooltip and table carry it. */
const MIN_LABEL_SHARE = 0.12

interface Props {
  stats: TaskStats
  stale: boolean
}

/** One stacked bar per priority, segmented by status; rows share one scale. */
export function PriorityChart({ stats, stale }: Props) {
  const { t } = useTranslation()
  const colors = useChartColors()

  const rows = stats.by_priority.map((row) => ({
    ...row,
    label: t(`tasks.priority.${row.priority}`),
    total: STATUSES.reduce((sum, status) => sum + row[status], 0),
  }))
  const max = Math.max(1, ...rows.map((row) => row.total))

  return (
    <ChartCard title={t('tasks.charts.priorityTitle')} stale={stale}>
      <div aria-hidden className="flex flex-col gap-4">
        <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
          {STATUSES.map((status) => (
            <li key={status} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: colors[status] }} />
              <Typography.Text type="secondary" className="text-xs">
                {t(`tasks.status.${status}`)}
              </Typography.Text>
            </li>
          ))}
        </ul>

        {rows.map((row, rowIndex) => {
          const filled = STATUSES.filter((status) => row[status] > 0)
          return (
            <div key={row.priority} className="flex items-center gap-3">
              <Typography.Text type="secondary" className="w-16 shrink-0" ellipsis>
                {row.label}
              </Typography.Text>
              <div className="h-6 min-w-0 flex-1">
                <m.div
                  // 2px gaps between segments show the card surface through.
                  className="flex h-full gap-[2px]"
                  style={{ width: `${(row.total / max) * 100}%`, originX: 0 }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ ...transitions.enter, duration: 0.7, delay: 0.25 + rowIndex * 0.08 }}
                >
                  {filled.map((status, index) => {
                    const share = row[status] / row.total
                    const last = index === filled.length - 1
                    return (
                      <Tooltip key={status} title={`${row.label} · ${t(`tasks.status.${status}`)}: ${row[status]}`}>
                        <div
                          className="flex h-full items-center justify-center text-xs font-semibold"
                          style={{
                            flexGrow: row[status],
                            flexBasis: 0,
                            background: colors[status],
                            color: inkOn(colors[status]),
                            borderRadius: last ? '0 4px 4px 0' : 0,
                          }}
                        >
                          {share >= MIN_LABEL_SHARE && row[status]}
                        </div>
                      </Tooltip>
                    )
                  })}
                </m.div>
              </div>
              <Typography.Text strong className="w-8 shrink-0 text-end tabular-nums">
                {row.total}
              </Typography.Text>
            </div>
          )
        })}
      </div>

      <ChartTable
        caption={t('tasks.charts.priorityTitle')}
        headers={[t('tasks.fields.priority'), ...STATUSES.map((status) => t(`tasks.status.${status}`))]}
        rows={rows.map((row) => [row.label, ...STATUSES.map((status) => row[status])])}
      />
    </ChartCard>
  )
}
