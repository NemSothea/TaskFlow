import { CheckSquareFilled, FilterOutlined, FlagOutlined, RiseOutlined } from '@ant-design/icons'
import { Card, Typography, theme } from 'antd'
import * as m from 'motion/react-m'
import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { PreferenceControls } from '../../components/PreferenceControls'
import { STAGGER, transitions } from '../../lib/motion'
import { BRAND_GRADIENT } from '../../preferences/brand'
import { ProgressRing } from '../tasks/ProgressRing'

interface Props {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

const rise = (step: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { ...transitions.enter, delay: 0.15 + step * STAGGER * 2 },
})

const glass: CSSProperties = {
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.25)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
}

/** Bar widths for the decorative task rows in the preview card. */
const PREVIEW_ROWS = [0.82, 0.64, 0.73]

export function AuthLayout({ title, subtitle, children, footer }: Props) {
  const { t } = useTranslation()
  const { token } = theme.useToken()

  const features = [
    { icon: <FlagOutlined />, text: t('auth.features.plan') },
    { icon: <FilterOutlined />, text: t('auth.features.find') },
    { icon: <RiseOutlined />, text: t('auth.features.track') },
  ]

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Brand panel: a top band on phones, the left half on desktop. */}
      <aside
        aria-label={t('app.name')}
        className="relative overflow-hidden px-6 py-8 sm:px-10 lg:flex lg:w-[46%] lg:flex-col lg:justify-center lg:px-14 lg:py-12"
        style={{ background: BRAND_GRADIENT, color: '#fff' }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.25), transparent 65%)' }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.4), transparent 65%)' }}
        />

        <div className="relative flex max-w-lg flex-col gap-6">
          <m.div className="flex items-center gap-2" {...rise(0)}>
            <CheckSquareFilled className="text-3xl" aria-hidden />
            <span className="text-2xl font-bold" style={{ letterSpacing: '-0.01em' }}>
              {t('app.name')}
            </span>
          </m.div>

          <m.p
            className="m-0 text-2xl font-bold leading-tight sm:text-3xl lg:text-5xl"
            style={{ letterSpacing: '-0.02em' }}
            {...rise(1)}
          >
            {t('app.tagline')}
          </m.p>

          <ul className="m-0 hidden list-none flex-col gap-3 p-0 lg:flex">
            {features.map((feature, index) => (
              <m.li key={feature.text} className="flex items-center gap-3 text-base" {...rise(2 + index)}>
                <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={glass}>
                  {feature.icon}
                </span>
                {feature.text}
              </m.li>
            ))}
          </ul>

          {/* Decorative product preview. */}
          <m.div
            aria-hidden
            className="mt-2 hidden items-center gap-6 rounded-2xl p-5 lg:flex"
            style={{ ...glass, boxShadow: '0 30px 60px -30px rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0, y: 30, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ ...transitions.layout, delay: 0.5 }}
          >
            <ProgressRing percent={75} label="" size={96} />
            <div className="flex flex-1 flex-col gap-3">
              {PREVIEW_ROWS.map((width, index) => (
                <div key={width} className="flex items-center gap-2">
                  <span
                    className="size-4 shrink-0 rounded-full"
                    style={{ background: index === 0 ? '#6ee7b7' : 'rgba(255,255,255,0.35)' }}
                  />
                  <m.span
                    className="h-2.5 rounded-full"
                    style={{ width: `${width * 100}%`, background: 'rgba(255,255,255,0.55)', originX: 0 }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ ...transitions.enter, delay: 0.8 + index * 0.12 }}
                  />
                </div>
              ))}
            </div>
          </m.div>
        </div>
      </aside>

      <div
        className="auth-backdrop flex flex-1 flex-col"
        style={{ '--auth-glow': token.colorPrimaryBg, '--auth-dot': token.colorFill } as CSSProperties}
      >
        <header className="flex justify-end p-4">
          <PreferenceControls />
        </header>
        <main className="flex flex-1 items-start justify-center px-4 pb-12 sm:items-center">
          <m.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.enter}
          >
            <Card style={{ boxShadow: token.boxShadowTertiary }}>
              <Typography.Title level={1} className="!mb-1 !text-2xl">
                {title}
              </Typography.Title>
              <Typography.Paragraph type="secondary">{subtitle}</Typography.Paragraph>
              {children}
            </Card>
            <div className="mt-4 text-center">{footer}</div>
          </m.div>
        </main>
      </div>
    </div>
  )
}
