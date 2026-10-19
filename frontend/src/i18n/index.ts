import dayjs from 'dayjs'
import 'dayjs/locale/km'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { readStorage } from '../lib/storage'
import en from './locales/en'
import km from './locales/km'

export const LANGUAGES = ['en', 'km'] as const
export type Language = (typeof LANGUAGES)[number]
export const LANGUAGE_STORAGE_KEY = 'taskflow.language'

function initialLanguage(): Language {
  const stored = readStorage(LANGUAGE_STORAGE_KEY)
  if (stored === 'en' || stored === 'km') return stored
  return navigator.language?.toLowerCase().startsWith('km') ? 'km' : 'en'
}

dayjs.extend(localizedFormat)

// Registered before init so dayjs switches locale before React re-renders.
i18n.on('languageChanged', (lng) => {
  dayjs.locale(lng)
  document.documentElement.lang = lng
})

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, km: { translation: km } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes output
})

export default i18n

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof en }
  }
}
