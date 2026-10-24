import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { Skeleton, Typography, theme } from 'antd'
import * as m from 'motion/react-m'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import type { TaskStatus, TaskSummary } from '../../api/types'
import { AnimatedNumber } from '../../components/AnimatedNumber'
import { STAGGER, transitions } from '../../lib/motion'
import { useChartColors } from './charts/colors'

interface Props {
  summary: TaskSummary | undefined
  /** The status filter currently applied, if any. */
  activeStatus: TaskStatus | undefined
  /** `undefined` means "all statuses". */
  onSelect: (status: TaskStatus | undefined) => void
}

interface Item {
  key: 'total' | TaskStatus
  status: TaskStatus | undefined
  label: string
  value: number | undefined
  icon: ReactNode
  color: string
  background: string
}

/** Per-status counts. Each card is a toggle that filters the list by that status. */
export function TaskSummaryCards({ summary, activeStatus, onSelect }: Props) {
  const { t } = useTranslation()
  const { token } = theme.useToken()
  // Same hues as the charts, so a status reads the same everywhere on the page.
  const chart = useChartColors()

  const items: Item[] = [
    {
      key: 'total',
      status: undefined,
      label: t('tasks.total'),
      value: summary?.total,
      icon: <UnorderedListOutlined />,
      color: token.colorPrimary,
      background: token.colorPrimaryBg,
    },
    {
      key: 'todo',
      status: 'todo',
      label: t('tasks.status.todo'),
      value: summary?.todo,
      icon: <ClockCircleOutlined />,
      color: chart.todo,
      background: `${chart.todo}1f`,
    },
    {
      key: 'in_progress',
      status: 'in_progress',
      label: t('tasks.status.in_progress'),
      value: summary?.in_progress,
      icon: <SyncOutlined />,
      color: chart.in_progress,
      background: `${chart.in_progress}1f`,
    },
    {
      key: 'done',
      status: 'done',
      label: t('tasks.status.done'),
      value: summary?.done,
      icon: <CheckCircleOutlined />,
      color: chart.done,
      background: `${chart.done}1f`,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item, index) => {
        const pressed = item.status === activeStatus
        const interactive = item.value !== undefined
        const ring = `0 0 0 1px ${item.color}`
        const glow = `0 14px 32px -14px ${item.color}`
        return (
          <m.button
            key={item.key}
            type="button"
            aria-pressed={pressed}
            disabled={!interactive}
            onClick={() => onSelect(pressed ? undefined : item.status)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.layout, delay: 0.15 + index * STAGGER }}
            whileHover={
              interactive
                ? { y: -4, boxShadow: [pressed && ring, glow].filter(Boolean).join(', '), transition: transitions.fast }
                : undefined
            }
            whileTap={interactive ? { scale: 0.97, transition: transitions.fast } : undefined}
            className="relative flex w-full cursor-pointer flex-col gap-3 overflow-hidden p-4 text-start disabled:cursor-default"
            style={{
              font: 'inherit',
              color: token.colorText,
              // Selected card takes a tint of its own status colour.
              background: pressed
                ? `linear-gradient(160deg, ${item.background}, ${token.colorBgContainer} 75%)`
                : token.colorBgContainer,
              border: `1px solid ${pressed ? item.color : token.colorBorderSecondary}`,
              boxShadow: pressed ? ring : undefined,
              borderRadius: token.borderRadiusLG + 4,
            }}
          >
            {/* Accent bar in the status colour. */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: item.color }} />
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center text-lg"
                style={{ color: item.color, background: item.background, borderRadius: token.borderRadiusLG }}
              >
                {item.icon}
              </span>
              <Typography.Text type="secondary" ellipsis>
                {item.label}
              </Typography.Text>
            </span>
            {item.value === undefined ? (
              <Skeleton active paragraph={false} title={{ width: '40%' }} />
            ) : (
              <AnimatedNumber
                value={item.value}
                className="text-3xl font-bold leading-none tabular-nums"
              />
            )}
          </m.button>
        )
      })}
    </div>
  )
}
