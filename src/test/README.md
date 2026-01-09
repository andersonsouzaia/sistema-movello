# Testes Unitários - Vitest

Testes unitários e de integração usando Vitest e React Testing Library.

## Executar Testes

```bash
# Executar todos os testes
npm run test

# Executar com UI interativa
npm run test:ui

# Executar com coverage
npm run test:coverage

# Executar em modo watch
npm run test -- --watch
```

## Estrutura

- `setup.ts` - Configuração global dos testes
- `utils/test-helpers.ts` - Helpers e mocks reutilizáveis

## Escrevendo Testes

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils/test-helpers'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('deve renderizar corretamente', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```
