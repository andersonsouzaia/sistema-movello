import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-helpers'
import { useAuth } from '@/contexts/AuthContext'
import MotoristaDashboard from '@/pages/motorista/Dashboard'

// Mock do AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock dos hooks
vi.mock('@/hooks/useMotoristaGanhos', () => ({
  useMotoristaGanhosStats: vi.fn(() => ({
    stats: {
      ganhos_hoje: 100,
      ganhos_mes: 1000,
      total_pendente: 200,
      total_pago: 800,
      total_ganhos: 1000,
    },
    loading: false,
    refetch: vi.fn(),
  })),
}))

describe('Motorista Dashboard', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '123', email: 'test@test.com' },
      motorista: {
        id: '123',
        status: 'aprovado',
        tablet_id: null,
      },
      profile: {
        id: '123',
        nome: 'Teste',
        tipo: 'motorista',
      },
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      refreshUser: vi.fn(),
    } as any)
  })

  it('deve renderizar dashboard do motorista', () => {
    render(<MotoristaDashboard />)
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
  })

  it('deve exibir cards de estatísticas', () => {
    render(<MotoristaDashboard />)
    expect(screen.getByText(/ganhos do dia/i)).toBeInTheDocument()
    expect(screen.getByText(/ganhos do mês/i)).toBeInTheDocument()
  })
})
