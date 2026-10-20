import { expect, type Page } from '@playwright/test'

export const PASSWORD = 'E2e-Secure-pass-9137'

/** A username no other test or earlier run has used. */
export function uniqueUser(prefix = 'e2e') {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  return { username: `${prefix}_${id}`, email: `${prefix}_${id}@example.com` }
}

export async function register(page: Page, user: { username: string; email: string }) {
  await page.goto('/register')
  await page.getByLabel('Username').fill(user.username)
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Confirm password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByText('Account created. Please sign in.')).toBeVisible()
}

export async function login(page: Page, username: string) {
  if (!page.url().endsWith('/login')) await page.goto('/login')
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'My tasks' })).toBeVisible()
}

export async function signUpAndLogIn(page: Page, prefix?: string) {
  const user = uniqueUser(prefix)
  await register(page, user)
  await login(page, user.username)
  return user
}

export async function createTask(page: Page, title: string) {
  await page.getByRole('button', { name: 'New task' }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Title').fill(title)
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Task created.')).toBeVisible()
  await expect(page.getByText(title)).toBeVisible()
}
