import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { parseApiError } from '../../api/errors'
import type { LoginInput } from '../../api/types'
import { AuthLayout } from './AuthLayout'
import { useAuth } from './context'

interface LocationState {
  from?: string
  registered?: boolean
}

export function LoginPage() {
  const { t } = useTranslation()
  const { login, sessionExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFinish = async (values: LoginInput) => {
    setSubmitting(true)
    setError(null)
    try {
      await login(values)
      // Only follow same-app paths to avoid open redirects.
      const target = state.from?.startsWith('/') && !state.from.startsWith('//') ? state.from : '/'
      navigate(target, { replace: true })
    } catch (err) {
      const { status } = parseApiError(err)
      setError(
        status === 401
          ? t('auth.invalidCredentials')
          : status === 429
            ? t('auth.tooManyAttempts')
            : status === null
              ? t('common.networkError')
              : t('common.genericError'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const notice = state.registered
    ? { type: 'success' as const, text: t('auth.registered') }
    : sessionExpired
      ? { type: 'warning' as const, text: t('auth.sessionExpired') }
      : null

  return (
    <AuthLayout
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <Typography.Text>
          {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
        </Typography.Text>
      }
    >
      {notice && !error && <Alert className="mb-4" type={notice.type} title={notice.text} showIcon />}
      {error && <Alert className="mb-4" type="error" title={error} showIcon role="alert" />}
      <Form<LoginInput> layout="vertical" onFinish={onFinish} requiredMark={false} disabled={submitting}>
        <Form.Item
          label={t('auth.username')}
          name="username"
          rules={[{ required: true, whitespace: true, message: t('common.required') }]}
        >
          <Input prefix={<UserOutlined aria-hidden />} autoComplete="username" autoFocus />
        </Form.Item>
        <Form.Item
          label={t('auth.password')}
          name="password"
          rules={[{ required: true, message: t('common.required') }]}
        >
          <Input.Password prefix={<LockOutlined aria-hidden />} autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={submitting}>
          {t('auth.login')}
        </Button>
      </Form>
    </AuthLayout>
  )
}
