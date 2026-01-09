import { Page } from '@playwright/test'

/**
 * Helpers para autenticação nos testes E2E
 */

export interface TestUser {
  email: string
  password: string
  userType: 'admin' | 'empresa' | 'motorista'
}

/**
 * Usuários de teste padrão
 * ATENÇÃO: Estes devem ser criados no banco de dados antes dos testes
 */
export const testUsers: Record<string, TestUser> = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    userType: 'admin',
  },
  empresa: {
    email: 'empresa@test.com',
    password: 'empresa123',
    userType: 'empresa',
  },
  empresaPendente: {
    email: 'empresa.pendente@test.com',
    password: 'empresa123',
    userType: 'empresa',
  },
  motorista: {
    email: 'motorista@test.com',
    password: 'motorista123',
    userType: 'motorista',
  },
  motoristaPendente: {
    email: 'motorista.pendente@test.com',
    password: 'motorista123',
    userType: 'motorista',
  },
}

/**
 * Faz login como um usuário de teste
 */
export async function loginAs(page: Page, user: TestUser | string) {
  const userData = typeof user === 'string' ? testUsers[user] : user
  
  if (!userData) {
    throw new Error(`Usuário de teste não encontrado: ${user}`)
  }

  await page.goto('/login')
  
  // Preencher formulário de login
  await page.fill('input[name="email"]', userData.email)
  await page.fill('input[name="password"]', userData.password)
  
  // Clicar em submit
  await page.click('button[type="submit"]')
  
  // Aguardar redirecionamento
  await page.waitForURL(`/${userData.userType}/dashboard`, { timeout: 10000 })
}

/**
 * Faz logout
 */
export async function logout(page: Page) {
  // Procurar botão de logout (pode estar em menu dropdown)
  const logoutButton = page.locator('button:has-text("Sair")').or(
    page.locator('button:has-text("Logout")')
  ).or(
    page.locator('[data-testid="logout"]')
  )
  
  if (await logoutButton.isVisible()) {
    await logoutButton.click()
  } else {
    // Tentar acessar rota de logout diretamente
    await page.goto('/logout')
  }
  
  await page.waitForURL('/login', { timeout: 5000 })
}

/**
 * Verifica se usuário está autenticado
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const currentUrl = page.url()
  return !currentUrl.includes('/login') && !currentUrl.includes('/auth')
}
