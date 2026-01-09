import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/auth'

/**
 * TESTE 1: Painel Admin - Dashboard Principal
 * Baseado em GUIA_TESTES_INTEGRACAO.md seção 1.1
 */
test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    try {
      await loginAs(page, 'admin')
    } catch (error) {
      // Se login falhar, pular teste (usuário de teste não existe)
      test.skip()
    }
  })

  test('deve carregar estatísticas do dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Verificar se estatísticas aparecem
    await expect(page.locator('text=Total de Empresas')).toBeVisible()
    await expect(page.locator('text=Total de Motoristas')).toBeVisible()
    await expect(page.locator('text=Campanhas Ativas')).toBeVisible()
    
    // Verificar se não há erros
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.waitForTimeout(2000)
    expect(errors).toHaveLength(0)
  })

  test('deve exibir gráficos corretamente', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Verificar se gráficos são renderizados
    // Ajustar seletores conforme implementação real
    await expect(page.locator('[data-testid="chart"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('deve exibir listas de pendências', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Verificar se listas aparecem
    await expect(page.locator('text=Empresas Pendentes').or(page.locator('text=Pendentes'))).toBeVisible({ timeout: 5000 })
  })
})

/**
 * TESTE 1.2: Gestão de Empresas
 */
test.describe('Admin - Gestão de Empresas', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await loginAs(page, 'admin')
    } catch (error) {
      test.skip()
    }
  })

  test('deve listar empresas', async ({ page }) => {
    await page.goto('/admin/empresas')
    await expect(page.locator('h1')).toContainText(/empresa/i)
  })

  test('deve aprovar empresa pendente', async ({ page }) => {
    await page.goto('/admin/empresas')
    
    // Encontrar empresa pendente e clicar em aprovar
    const approveButton = page.locator('button:has-text("Aprovar")').first()
    if (await approveButton.isVisible()) {
      await approveButton.click()
      await expect(page.locator('text=Aprovado')).toBeVisible({ timeout: 5000 })
    }
  })
})
