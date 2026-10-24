export const BRAND_COLOR = '#4f46e5'

/** Hero surfaces only. White text on every stop passes WCAG AA (4.5:1). */
export const BRAND_GRADIENT = 'linear-gradient(135deg, #4338ca 0%, #6d28d9 55%, #a21caf 100%)'

/**
 * Chart colours, one set per theme (validated with the dataviz palette checker:
 * lightness band, chroma floor, CVD separation, contrast). Status hues follow
 * the categorical slot order blue -> orange -> aqua; never reassign by rank.
 */
export const CHART_COLORS = {
  light: { in_progress: '#2a78d6', todo: '#eb6834', done: '#1baf7a', brand: '#4f46e5' },
  dark: { in_progress: '#3987e5', todo: '#d95926', done: '#199e70', brand: '#6d64f0' },
} as const
