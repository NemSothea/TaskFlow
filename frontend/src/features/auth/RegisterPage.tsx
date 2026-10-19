import { Alert, Button, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import { parseApiError } from '../../api/errors'
import type { RegisterInput } from '../../api/types'
import { applyFieldErrors } from '../../lib/forms'
import { AuthLayout } from './AuthLayout'
import { useAuth } from './context'

type RegisterForm = RegisterInput & { confirm: string }

export function RegisterPage() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm<RegisterForm>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFinish = async ({ confirm: _confirm, ...values }: RegisterForm) => {
    setSubmitting(true)
    setError(null)
    try {
      await register(values)
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (err) {
      const apiError = parseApiError(err)
      const hadFieldErrors = applyFieldErrors(form, apiError.fieldErrors)
      if (!hadFieldErrors) {
        setError(
          apiError.status === 429
            ? t('auth.tooManyAttempts')
            : apiError.status === null
              ? t('common.networkError')
              : (apiError.message ?? t('common.genericError')),
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <Typography.Text>
          {t('auth.haveAccount')} <Link to="/login">{t('auth.login')}</Link>
        </Typography.Text>
      }
    >
      {error && <Alert className="mb-4" type="error" title={error} showIcon role="alert" />}
      <Form<RegisterForm>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        disabled={submitting}
      >
        <Form.Item
          label={t('auth.username')}
          name="username"
          rules={[{ required: true, whitespace: true, message: t('common.required') }]}
        >
          <Input autoComplete="username" autoFocus />
        </Form.Item>
        <Form.Item
          label={t('auth.email')}
          name="email"
          rules={[
            { required: true, message: t('common.required') },
            { type: 'email', message: t('auth.invalidEmail') },
          ]}
        >
          <Input type="email" autoComplete="email" />
        </Form.Item>
        <Form.Item
          label={t('auth.password')}
          name="password"
          rules={[{ required: true, message: t('common.required') }]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label={t('auth.confirmPassword')}
          name="confirm"
          dependencies={['password']}
          rules={[
            { required: true, message: t('common.required') },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || getFieldValue('password') === value
                  ? Promise.resolve()
                  : Promise.reject(new Error(t('auth.passwordsMismatch'))),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={submitting}>
          {t('auth.register')}
        </Button>
      </Form>
    </AuthLayout>
  )
}
