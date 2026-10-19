import { App as AntApp, ConfigProvider, theme as antTheme } from 'antd'
import enUS from 'antd/locale/en_US'
import kmKH from 'antd/locale/km_KH'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LANGUAGE_STORAGE_KEY, type Language } from '../i18n'
import { readStorage, writeStorage } from '../lib/storage'
import { PreferencesContext, type ThemeMode } from './context'

const THEME_STORAGE_KEY = 'taskflow.theme'

const FONT_FAMILY =
  "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans Khmer', 'Helvetica Neue', Arial, sans-serif"

function initialTheme(): ThemeMode {
  const stored = readStorage(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialTheme)
  const language = (i18n.resolvedLanguage ?? 'en') as Language

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = themeMode
    root.style.colorScheme = themeMode
    writeStorage(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  useEffect(() => {
    writeStorage(LANGUAGE_STORAGE_KEY, language)
  }, [language])

  const toggleTheme = useCallback(
    () => setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark')),
    [],
  )
  const setLanguage = useCallback((lng: Language) => void i18n.changeLanguage(lng), [i18n])

  const value = useMemo(
    () => ({ themeMode, toggleTheme, language, setLanguage }),
    [themeMode, toggleTheme, language, setLanguage],
  )

  const antdTheme = useMemo(
    () => ({
      algorithm: themeMode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      token: {
        colorPrimary: '#4f46e5',
        borderRadius: 8,
        fontFamily: FONT_FAMILY,
        // Khmer glyphs have tall stacked vowels/subscripts; give them room.
        lineHeight: language === 'km' ? 1.75 : 1.5715,
      },
    }),
    [themeMode, language],
  )

  return (
    <PreferencesContext.Provider value={value}>
      <ConfigProvider theme={antdTheme} locale={language === 'km' ? kmKH : enUS}>
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </PreferencesContext.Provider>
  )
}
