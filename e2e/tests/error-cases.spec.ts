import { test, expect } from '@playwright/test'

/**
 * TESTE 5: Casos de Erro
 * Baseado em GUIA_TESTES_INTEGRACAO.md seção 5
 */

/**
 * TESTE 5.2: Erros de Permissão
 */
test.describe('Erros de Permissão', () => {
  test('deve redirecionar empresa tentando acessar admin', async ({ page }) => {
    // TODO: Login como empresa
    await page.goto('/admin/dashboard')
    
    // Deve redirecionar ou mostrar erro
    await page.waitForTimeout(2000)
    const currentUrl = page.url()
    expect(currentUrl).not.toContain('/admin/dashboard')
  })

  test('deve redirecionar motorista tentando acessar empresa', async ({ page }) => {
    // TODO: Login como motorista
    await page.goto('/empresa/dashboard')
    
    await page.waitForTimeout(2000)
    const currentUrl = page.url()
    expect(currentUrl).not.toContain('/empresa/dashboard')
  })
})

/**
 * TESTE 5.4: Erros de Estado
 */
test.describe('Erros de Estado', () => {
  test('deve bloquear login de empresa bloqueada', async ({ page }) => {
    await page.goto('/login')
    
    // Tentar login com conta bloqueada
    // TODO: Implementar quando tiver conta de teste bloqueada
    
    // Deve mostrar mensagem de erro
    await expect(page.locator('text=bloqueado').or(page.locator('text=erro'))).toBeVisible({ timeout: 5000 })
  })
})
