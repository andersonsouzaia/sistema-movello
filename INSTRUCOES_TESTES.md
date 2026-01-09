# Instruções para Executar Testes

## 📦 Instalação

### 1. Instalar Dependências

```bash
npm install
```

### 2. Instalar Playwright Browsers

```bash
npx playwright install
```

## 🧪 Executar Testes

### Testes Unitários (Vitest)

```bash
# Executar todos os testes unitários
npm run test

# Executar com UI interativa
npm run test:ui

# Executar com coverage
npm run test:coverage

# Executar em modo watch
npm run test -- --watch
```

### Testes E2E (Playwright)

```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar com UI interativa
npm run test:e2e:ui

# Executar em modo headed (ver navegador)
npm run test:e2e:headed

# Executar testes específicos
npx playwright test admin-dashboard
npx playwright test motorista-dashboard
npx playwright test integration-flows
```

### Executar Todos os Testes

```bash
npm run test:all
```

## 🔧 Configuração de Usuários de Teste

Antes de executar os testes E2E, você precisa criar usuários de teste no banco de dados:

### Usuários Necessários

1. **Admin**
   - Email: `admin@test.com`
   - Password: `admin123`
   - Tipo: `admin`

2. **Empresa**
   - Email: `empresa@test.com`
   - Password: `empresa123`
   - Tipo: `empresa`
   - Status: `aprovado`

3. **Empresa Pendente**
   - Email: `empresa.pendente@test.com`
   - Password: `empresa123`
   - Tipo: `empresa`
   - Status: `aguardando_aprovacao`

4. **Motorista**
   - Email: `motorista@test.com`
   - Password: `motorista123`
   - Tipo: `motorista`
   - Status: `aprovado`

5. **Motorista Pendente**
   - Email: `motorista.pendente@test.com`
   - Password: `motorista123`
   - Tipo: `motorista`
   - Status: `aguardando_aprovacao`

### Criar Usuários de Teste

Você pode criar esses usuários manualmente através da interface ou usar SQL:

```sql
-- Criar usuários de teste (ajustar conforme necessário)
-- Nota: Você precisará criar os usuários através do sistema de autenticação
```

## 📝 Estrutura de Testes

### Testes Unitários (`src/test/`)
- `setup.ts` - Configuração global
- `utils/test-helpers.ts` - Helpers e mocks
- `components/` - Testes de componentes

### Testes E2E (`e2e/tests/`)
- `auth.spec.ts` - Testes de autenticação
- `admin-dashboard.spec.ts` - Testes do painel admin
- `empresa-dashboard.spec.ts` - Testes do painel empresa
- `motorista-dashboard.spec.ts` - Testes do painel motorista
- `integration-flows.spec.ts` - Testes de integração
- `error-cases.spec.ts` - Testes de casos de erro
- `checklist.spec.ts` - Checklist de funcionalidades críticas

### Helpers (`e2e/helpers/`)
- `auth.ts` - Funções de login/logout
- `test-data.ts` - Dados de teste reutilizáveis

## 🚀 Executar Servidor de Desenvolvimento

Os testes E2E esperam que o servidor esteja rodando em `http://localhost:8080`:

```bash
npm run dev
```

O Playwright iniciará o servidor automaticamente se não estiver rodando (quando executado via `npm run test:e2e`).

## 📊 Relatórios

### Vitest
- Coverage: `coverage/` (após `npm run test:coverage`)
- UI: Abre automaticamente ao executar `npm run test:ui`

### Playwright
- HTML Report: `playwright-report/` (abre automaticamente após testes)
- Screenshots: `test-results/` (em caso de falhas)

## ⚠️ Notas Importantes

1. **Usuários de Teste**: Certifique-se de criar os usuários de teste antes de executar os testes E2E
2. **Banco de Dados**: Os testes podem criar/modificar dados. Use um banco de teste separado se possível
3. **Timeout**: Alguns testes podem precisar de mais tempo. Ajuste `timeout` nos testes se necessário
4. **Ambiente**: Os testes esperam que o ambiente de desenvolvimento esteja configurado corretamente

## 🔍 Debug

### Debug Playwright

```bash
# Executar com debug
PWDEBUG=1 npm run test:e2e

# Executar teste específico com debug
npx playwright test admin-dashboard --debug
```

### Ver Logs

Os testes capturam erros da página. Verifique o console do navegador durante execução em modo `headed`.

## 📚 Documentação Adicional

- [Guia de Testes de Integração](./GUIA_TESTES_INTEGRACAO.md)
- [Testes Implementados](./TESTES_IMPLEMENTADOS.md)
- [Playwright Docs](https://playwright.dev)
- [Vitest Docs](https://vitest.dev)
