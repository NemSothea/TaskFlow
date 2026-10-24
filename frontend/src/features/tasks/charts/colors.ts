import { CHART_COLORS } from '../../../preferences/brand'
import { usePreferences } from '../../../preferences/context'

/** The validated chart palette for the active theme. */
export function useChartColors() {
  return CHART_COLORS[usePreferences().themeMode]
}

/** Text drawn inside a filled mark: white or ink, whichever has more WCAG contrast. */
export function inkOn(color: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(color.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  const withWhite = 1.05 / (luminance + 0.05)
  const withInk = (luminance + 0.05) / 0.0545 // ink #0b0b0b
  return withWhite >= withInk ? '#ffffff' : '#0b0b0b'
}
