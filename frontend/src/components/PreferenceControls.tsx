import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import { Button, Segmented, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'

import type { Language } from '../i18n'
import { usePreferences } from '../preferences/context'

export function PreferenceControls() {
  const { t } = useTranslation()
  const { themeMode, toggleTheme, language, setLanguage } = usePreferences()
  const themeLabel = themeMode === 'dark' ? t('nav.switchToLight') : t('nav.switchToDark')

  return (
    <div className="flex items-center gap-2">
      <Segmented<Language>
        size="small"
        aria-label={t('nav.language')}
        value={language}
        onChange={setLanguage}
        options={[
          { label: 'EN', value: 'en' },
          { label: 'ខ្មែរ', value: 'km' },
        ]}
      />
      <Tooltip title={themeLabel}>
        <Button
          type="text"
          shape="circle"
          aria-label={themeLabel}
          icon={themeMode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
        />
      </Tooltip>
    </div>
  )
}
