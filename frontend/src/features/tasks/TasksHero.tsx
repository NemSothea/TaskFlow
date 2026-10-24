import { PlusOutlined } from '@ant-design/icons'
import { Button, theme } from 'antd'
import { useAnimate, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { TaskSummary } from '../../api/types'
import { Burst } from '../../components/Burst'
import { STAGGER, transitions } from '../../lib/motion'
import { BRAND_GRADIENT } from '../../preferences/brand'
import { useAuth } from '../auth/context'
import { greetingKey } from './greeting'
import { ProgressRing } from './ProgressRing'

interface Props {
  summary: TaskSummary | undefined
  onNewTask: () => void
  /** Increments each time a task is completed; replays the celebration burst. */
  celebrate: number
}

const rise = (step: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { ...transitions.enter, delay: 0.1 + step * STAGGER },
})

/** Page header: greeting, title, open-task count, completion ring and the primary action. */
export function TasksHero({ summary, onNewTask, celebrate }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { token } = theme.useToken()
  // Read once per mount: the greeting should not flip while the page is open.
  const [hour] = useState(() => new Date().getHours())
  const [ringScope, animateRing] = useAnimate<HTMLDivElement>()
  const reduceMotion = useReducedMotion()

  // Pop the ring on each completion without remounting it (that would restart its count-up).
  useEffect(() => {
    if (celebrate === 0 || reduceMotion || !ringScope.current) return
    void animateRing(ringScope.current, { scale: [1, 1.12, 1] }, { duration: 0.5, ease: 'easeOut' })
  }, [celebrate, reduceMotion, animateRing, ringScope])

  const open = summary ? summary.total - summary.done : undefined
  const percent = summary && summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0

  return (
    <m.header
      className="relative overflow-hidden px-5 py-6 sm:px-8 sm:py-7"
      style={{ background: BRAND_GRADIENT, color: '#fff', borderRadius: token.borderRadiusLG * 2 }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={transitions.enter}
    >
      {/* Soft light blobs for depth. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.28), transparent 65%)' }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-28 left-1/4 size-72 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.35), transparent 65%)' }}
      />

      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          {user && (
            <m.p className="m-0 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }} {...rise(0)}>
              {t(`tasks.hero.${greetingKey(hour)}`, { name: user.username })}
            </m.p>
          )}
          <m.h1 className="m-0 text-3xl font-bold sm:text-4xl" style={{ letterSpacing: '-0.02em' }} {...rise(1)}>
            {t('tasks.heading')}
          </m.h1>
          {open !== undefined && (
            <m.p className="m-0 text-base" style={{ color: 'rgba(255,255,255,0.9)' }} {...rise(2)}>
              {open === 0 && summary!.total > 0 ? t('tasks.hero.allDone') : t('tasks.hero.openCount', { count: open })}
            </m.p>
          )}
          <m.div className="mt-4" {...rise(3)}>
            <Button
              size="large"
              icon={<PlusOutlined />}
              onClick={onNewTask}
              className="!border-0 !font-semibold"
              style={{ background: '#fff', color: token.colorPrimary, boxShadow: '0 8px 24px -8px rgba(0,0,0,0.45)' }}
            >
              {t('tasks.newTask')}
            </Button>
          </m.div>
        </div>

        {summary && (
          <div className="relative">
            <div ref={ringScope}>
              <ProgressRing percent={percent} label={t('tasks.percentDone', { percent })} />
            </div>
            <Burst key={`burst-${celebrate}`} trigger={celebrate} />
          </div>
        )}
      </div>
    </m.header>
  )
}
