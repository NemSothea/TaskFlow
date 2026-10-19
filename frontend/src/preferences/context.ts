import { createContext, useContext } from 'react'

import type { Language } from '../i18n'

export type ThemeMode = 'light' | 'dark'

export interface Preferences {
  themeMode: ThemeMode
  toggleTheme: () => void
  language: Language
  setLanguage: (language: Language) => void
}

export const PreferencesContext = createContext<Preferences | null>(null)

export function usePreferences(): Preferences {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider')
  return ctx
}
