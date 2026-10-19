import { Spin } from 'antd'
import { useTranslation } from 'react-i18next'

export function FullPageSpinner() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
      <Spin size="large" description={t('common.loading')} />
    </div>
  )
}
