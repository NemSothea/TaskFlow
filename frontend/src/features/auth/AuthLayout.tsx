import { CheckSquareTwoTone } from '@ant-design/icons'
import { Card, Typography } from 'antd'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { PreferenceControls } from '../../components/PreferenceControls'

interface Props {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex justify-end p-4">
        <PreferenceControls />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-12 sm:items-center">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-center gap-2">
            <CheckSquareTwoTone className="text-3xl" aria-hidden />
            <Typography.Text strong style={{ fontSize: 24 }}>
              {t('app.name')}
            </Typography.Text>
          </div>
          <Card>
            <Typography.Title level={1} className="!mb-1 !text-2xl">
              {title}
            </Typography.Title>
            <Typography.Paragraph type="secondary">{subtitle}</Typography.Paragraph>
            {children}
          </Card>
          <div className="mt-4 text-center">{footer}</div>
        </div>
      </main>
    </div>
  )
}
