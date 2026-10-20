import { expect, test } from '@playwright/test'

import { createTask, signUpAndLogIn } from './helpers'

test.describe('task journeys', () => {
  test('a new user signs up, manages a task, survives a reload, and logs out', async ({ page }) => {
    await signUpAndLogIn(page)
    await expect(page.getByText('No tasks yet')).toBeVisible()

    await createTask(page, 'Buy milk')

    // The access token is in memory only; the httpOnly refresh cookie restores the session.
    await page.reload()
    await expect(page.getByRole('heading', { name: 'My tasks' })).toBeVisible()
    await expect(page.getByText('Buy milk')).toBeVisible()

    await page.getByRole('button', { name: 'Mark as done: Buy milk' }).click()
    await expect(page.getByText('Task updated.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark as done: Buy milk' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Delete: Buy milk' }).click()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(page.getByText('Task deleted.')).toBeVisible()
    await expect(page.getByText('No tasks yet')).toBeVisible()

    await page.getByRole('button', { name: 'Account menu' }).click()
    await page.getByRole('menuitem', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/\/login$/)

    // After logout the refresh cookie is gone, so the app stays signed out.
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('never stores tokens in web storage', async ({ page }) => {
    await signUpAndLogIn(page)
    const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))
    expect(stored).not.toMatch(/eyJ[\w-]+\.[\w-]+/) // JWT shape
  })

  test("one user never sees another user's tasks", async ({ browser }) => {
    const alice = await browser.newContext()
    const alicePage = await alice.newPage()
    await signUpAndLogIn(alicePage, 'alice')
    await createTask(alicePage, 'Alice private task')

    const bob = await browser.newContext()
    const bobPage = await bob.newPage()
    await signUpAndLogIn(bobPage, 'bob')
    await expect(bobPage.getByText('No tasks yet')).toBeVisible()
    await bobPage.getByRole('searchbox', { name: 'Search tasks…' }).fill('Alice private task')
    await bobPage.keyboard.press('Enter')
    await expect(bobPage.getByText('No tasks match your filters.')).toBeVisible()

    await alice.close()
    await bob.close()
  })

  test('filters live in the URL and survive a reload', async ({ page }) => {
    await signUpAndLogIn(page)
    await createTask(page, 'Water plants')
    await createTask(page, 'Pay rent')

    await page.getByRole('searchbox', { name: 'Search tasks…' }).fill('rent')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/search=rent/)
    await expect(page.getByText('Water plants')).toHaveCount(0)

    await page.reload()
    await expect(page.getByText('Pay rent')).toBeVisible()
    await expect(page.getByText('Water plants')).toHaveCount(0)
  })

  test('the language choice applies everywhere and persists', async ({ page }) => {
    await page.goto('/login')
    await page.getByText('ខ្មែរ').click()
    await expect(page.getByRole('heading', { name: 'ចូលគណនី' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'ចូលគណនី' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'km')
  })
})

test.describe('mobile', () => {
  test('tasks render as cards with no horizontal scroll @mobile', async ({ page }) => {
    await signUpAndLogIn(page)
    await createTask(page, 'Phone task')

    await expect(page.getByRole('table')).toHaveCount(0)
    await expect(page.getByRole('listitem').filter({ hasText: 'Phone task' })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(overflow).toBe(false)
  })
})
