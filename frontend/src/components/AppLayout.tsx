import { CheckSquareTwoTone, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Dropdown, Layout, Typography, theme } from 'antd'
import * as m from 'motion/react-m'
import { useTranslation } from 'react-i18next'
import { Link, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../features/auth/context'
import { transitions } from '../lib/motion'
import { PreferenceControls } from './PreferenceControls'

export function AppLayout() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { token } = theme.useToken()
  const { pathname } = useLocation()

  return (
    <Layout className="min-h-dvh">
      <Layout.Header
        className="sticky top-0 z-10 flex items-center justify-between gap-3 !px-4 sm:!px-6"
        style={{
          // Translucent so content scrolling underneath stays visible behind the blur.
          background: `color-mix(in srgb, ${token.colorBgContainer} 80%, transparent)`,
          backdropFilter: 'saturate(180%) blur(12px)',
          WebkitBackdropFilter: 'saturate(180%) blur(12px)',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Link to="/" className="flex items-center gap-2" aria-label={t('app.name')}>
          <CheckSquareTwoTone className="text-2xl" twoToneColor={token.colorPrimary} aria-hidden />
          <Typography.Text strong className="hidden sm:inline" style={{ fontSize: 18 }}>
            {t('app.name')}
          </Typography.Text>
        </Link>
        <div className="flex items-center gap-2">
          <PreferenceControls />
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'user', label: user?.email, disabled: true },
                { type: 'divider' },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: t('nav.logout'),
                  onClick: () => void logout(),
                },
              ],
            }}
          >
            <Button type="text" aria-label={t('nav.account')} className="!px-1">
              <Avatar size="small" icon={<UserOutlined />} />
              <span className="hidden max-w-32 truncate md:inline">{user?.username}</span>
            </Button>
          </Dropdown>
        </div>
      </Layout.Header>
      <Layout.Content className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {/* Keyed by path so each page fades in when navigated to. */}
        <m.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.enter}
        >
          <Outlet />
        </m.div>
      </Layout.Content>
    </Layout>
  )
}
