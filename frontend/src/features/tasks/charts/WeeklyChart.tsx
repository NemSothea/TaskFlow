import { Tooltip, Typography, theme } from 'antd'
import * as m from 'motion/react-m'
import { useTranslation } from 'react-i18next'

import type { TaskStats } from '../../../api/types'
import { usePreferences } from '../../../preferences/context'
import { transitions } from '../../../lib/motion'
import { ChartCard, ChartTable } from './ChartCard'
import { useChartColors } from './colors'
import { niceCeil, parseLocalDate } from './scale'

const PLOT_HEIGHT = 140

interface Props {
  stats: TaskStats
  stale: boolean
}

/** Column per week (single series, brand colour); labels only on the latest and the peak. */
export function WeeklyChart({ stats, stale }: Props) {
  const { t } = useTranslation()
  const { token } = theme.useToken()
  const { language } = usePreferences()
  const colors = useChartColors()

  const format = new Intl.DateTimeFormat(language === 'km' ? 'km-KH' : 'en-US', { month: 'short', day: 'numeric' })
  const weeks = stats.created_per_week.map((week) => ({
    ...week,
    label: format.format(parseLocalDate(week.week_start)),
  }))
  const axisMax = niceCeil(Math.max(...weeks.map((week) => week.count)))
  const peak = weeks.reduce((best, week, index) => (week.count > weeks[best].count ? index : best), 0)
  const ticks = [axisMax, axisMax / 2, 0]

  return (
    <ChartCard title={t('tasks.charts.weeklyTitle')} extra={t('tasks.charts.weeklySubtitle')} stale={stale}>
      <div aria-hidden className="flex gap-2">
        {/* Y axis: clean ticks, recessive. */}
        <div className="relative w-6 shrink-0" style={{ height: PLOT_HEIGHT }}>
          {ticks.map((tick) => (
            <Typography.Text
              key={tick}
              type="secondary"
              className="absolute right-0 text-xs tabular-nums"
              style={{ top: `${(1 - tick / axisMax) * 100}%`, transform: 'translateY(-50%)' }}
            >
              {Number.isInteger(tick) ? tick : ''}
            </Typography.Text>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height: PLOT_HEIGHT }}>
            {/* Hairline gridlines, solid, one step off the surface. */}
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute inset-x-0 h-px"
                style={{ top: `${(1 - tick / axisMax) * 100}%`, background: token.colorBorderSecondary }}
              />
            ))}
            <div className="absolute inset-0 flex items-end justify-around">
              {weeks.map((week, index) => {
                const labelled = week.count > 0 && (index === weeks.length - 1 || index === peak)
                return (
                  <Tooltip key={week.week_start} title={`${t('tasks.charts.weekOf', { date: week.label })}: ${week.count}`}>
                    {/* Hit target is the full column slot, not just the painted bar. */}
                    <div className="relative flex h-full flex-1 cursor-default items-end justify-center">
                      {labelled && (
                        <Typography.Text
                          strong
                          className="absolute text-xs tabular-nums"
                          style={{ bottom: `calc(${(week.count / axisMax) * 100}% + 4px)` }}
                        >
                          {week.count}
                        </Typography.Text>
                      )}
                      <m.div
                        className="w-full max-w-6"
                        style={{
                          height: `${(week.count / axisMax) * 100}%`,
                          background: colors.brand,
                          borderRadius: '4px 4px 0 0',
                          originY: 1,
                        }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ ...transitions.enter, duration: 0.6, delay: 0.3 + index * 0.05 }}
                      />
                    </div>
                  </Tooltip>
                )
              })}
            </div>
          </div>
          {/* X labels: every other week (from the latest back) to avoid collisions. */}
          <div className="mt-2 flex justify-around">
            {weeks.map((week, index) => (
              <Typography.Text key={week.week_start} type="secondary" className="flex-1 whitespace-nowrap text-center text-xs">
                {(weeks.length - 1 - index) % 2 === 0 ? week.label : ''}
              </Typography.Text>
            ))}
          </div>
        </div>
      </div>

      <ChartTable
        caption={t('tasks.charts.weeklyTitle')}
        headers={[t('tasks.charts.weekOf', { date: '' }).trim(), t('tasks.charts.tasksCount')]}
        rows={weeks.map((week) => [week.label, week.count])}
      />
    </ChartCard>
  )
}
