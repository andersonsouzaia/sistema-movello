/* eslint-disable react-hooks/rules-of-hooks */
// Este arquivo contém fixtures do Playwright, não React hooks
// O parâmetro 'use' é parte da API do Playwright, não um React Hook

import { test as base } from '@playwright/test'
import { loginAs, logout } from '../helpers/auth'

/**
 * Fixture para autenticação nos testes
 * Nota: Fixtures do Playwright não são React hooks, então não usam 'use'
 */
export const test = base.extend({
  // Página autenticada como admin
  adminPage: async ({ page }, use) => {
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
  empresaPage: async ({ page }, use) => {
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
  motoristaPage: async ({ page }, use) => {
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
