import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'

/**
 * Wrapper customizado para testes que precisam de contexto
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

/**
 * Mock de dados de teste
 */
export const mockAdmin = {
  id: 'admin-123',
  email: 'admin@test.com',
  tipo: 'admin' as const,
  nome: 'Admin Teste',
}

export const mockEmpresa = {
  id: 'empresa-123',
  email: 'empresa@test.com',
  tipo: 'empresa' as const,
  nome: 'Empresa Teste',
  razao_social: 'Empresa Teste LTDA',
  status: 'aprovado' as const,
}

export const mockMotorista = {
  id: 'motorista-123',
  email: 'motorista@test.com',
  tipo: 'motorista' as const,
  nome: 'Motorista Teste',
  status: 'aprovado' as const,
  tablet_id: null,
}

export const mockCampanha = {
  id: 'campanha-123',
  empresa_id: 'empresa-123',
  titulo: 'Campanha Teste',
  descricao: 'Descrição da campanha teste',
  status: 'pendente' as const,
  orcamento: 1000,
  data_inicio: new Date().toISOString(),
  data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
}
