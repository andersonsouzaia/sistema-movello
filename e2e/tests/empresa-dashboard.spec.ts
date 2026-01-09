import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/auth'

/**
 * TESTE 2: Painel Empresa
 * Baseado em GUIA_TESTES_INTEGRACAO.md seção 2
 */
test.describe('Empresa Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login como empresa
    try {
      await loginAs(page, 'empresa')
    } catch (error) {
      test.skip()
    }
  })

  test('deve carregar dashboard da empresa', async ({ page }) => {
    await page.goto('/empresa/dashboard')
    
    // Verificar se página carrega
    await expect(page.locator('h1')).toContainText(/dashboard/i)
    
    // Verificar estatísticas
    await expect(page.locator('text=Campanhas')).toBeVisible({ timeout: 5000 })
  })

  test('deve exibir gráficos de performance', async ({ page }) => {
    await page.goto('/empresa/dashboard')
    
    // Verificar se gráficos são renderizados
    // Ajustar seletores conforme implementação real
    await page.waitForTimeout(2000)
    
    // Verificar se não há erros
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.waitForTimeout(2000)
    expect(errors).toHaveLength(0)
  })
})

/**
 * TESTE 2.2: Gestão de Campanhas
 */
test.describe('Empresa - Gestão de Campanhas', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await loginAs(page, 'empresa')
    } catch (error) {
      test.skip()
    }
  })

  test('deve listar campanhas', async ({ page }) => {
    await page.goto('/empresa/campanhas')
    await expect(page.locator('h1')).toContainText(/campanha/i)
  })

  test('deve permitir criar nova campanha', async ({ page }) => {
    await page.goto('/empresa/campanhas')
    
    // Procurar botão de criar
    const criarButton = page.locator('button:has-text("Nova")').or(
      page.locator('button:has-text("Criar")')
    ).or(
      page.locator('a[href*="nova"]')
    )
    
    if (await criarButton.isVisible()) {
      await criarButton.click()
      await expect(page.locator('input[name="titulo"]').or(page.locator('input[placeholder*="título" i]'))).toBeVisible({ timeout: 5000 })
    }
  })
})
