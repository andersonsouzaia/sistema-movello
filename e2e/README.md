# Testes E2E - Playwright

Testes end-to-end baseados no `GUIA_TESTES_INTEGRACAO.md`.

## Executar Testes

```bash
# Instalar dependências do Playwright
npx playwright install

# Executar todos os testes
npm run test:e2e

# Executar com UI interativa
npm run test:e2e:ui

# Executar em modo headed (ver navegador)
npm run test:e2e:headed

# Executar testes específicos
npx playwright test admin-dashboard
```

## Estrutura

- `tests/admin-dashboard.spec.ts` - Testes do painel admin
- `tests/motorista-dashboard.spec.ts` - Testes do painel motorista
- `tests/integration-flows.spec.ts` - Testes de integração entre módulos
- `tests/error-cases.spec.ts` - Testes de casos de erro

## Configuração

Os testes esperam que o servidor de desenvolvimento esteja rodando em `http://localhost:8080`.

Para configurar contas de teste, edite `playwright.config.ts` ou use variáveis de ambiente.
