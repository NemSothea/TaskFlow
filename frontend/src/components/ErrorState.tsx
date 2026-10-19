import { ReloadOutlined } from '@ant-design/icons'
import { Button, Result } from 'antd'
import { useTranslation } from 'react-i18next'

interface Props {
  title: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({ title, description, onRetry }: Props) {
  const { t } = useTranslation()
  return (
    <Result
      status="warning"
      title={title}
      subTitle={description}
      extra={
        onRetry && (
          <Button icon={<ReloadOutlined />} onClick={onRetry}>
            {t('common.retry')}
          </Button>
        )
      }
    />
  )
}
