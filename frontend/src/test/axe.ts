import axe from 'axe-core'
import { expect } from 'vitest'

/**
 * Fail the test if axe finds accessibility violations in `container`.
 * `color-contrast` is off: jsdom does no layout or CSS, so axe cannot measure it.
 */
export async function expectNoA11yViolations(container: Element) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  })
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`,
  )
  expect(summary).toEqual([])
}
