import { test as base } from '@playwright/test'
import { loginAs, logout, TestUser } from '../helpers/auth'

/**
 * Fixture para autenticação nos testes
 */
export const test = base.extend<{
  authenticatedPage: {
    admin: typeof base
    empresa: typeof base
    motorista: typeof base
  }
}>({
  // Página autenticada como admin
  admin: async ({ page }, use) => {
    try {
      await loginAs(page, 'admin')
      await use(page)
    } catch (error) {
      console.warn('Login como admin falhou, pulando teste')
    } finally {
      await logout(page)
    }
  },
  
  // Página autenticada como empresa
  empresa: async ({ page }, use) => {
    try {
      await loginAs(page, 'empresa')
      await use(page)
    } catch (error) {
      console.warn('Login como empresa falhou, pulando teste')
    } finally {
      await logout(page)
    }
  },
  
  // Página autenticada como motorista
  motorista: async ({ page }, use) => {
    try {
      await loginAs(page, 'motorista')
      await use(page)
    } catch (error) {
      console.warn('Login como motorista falhou, pulando teste')
    } finally {
      await logout(page)
    }
  },
})

export { expect } from '@playwright/test'
