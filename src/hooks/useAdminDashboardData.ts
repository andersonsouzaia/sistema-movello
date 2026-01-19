import { useQueries } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AdminStats, AdvancedStats } from './useAdminStats'
import type {
  Empresa,
  Motorista,
  Campanha,
  CampanhaWithEmpresa,
  Ticket,
  AuditLog,
  Notification,
  FinancialSummary
} from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'

interface AdminDashboardData {
  stats: AdminStats | null
  advancedStats: AdvancedStats | null
  empresasPendentes: Empresa[]
  motoristasPendentes: Motorista[]
  campanhasPendentes: Campanha[]
  campanhasAtivas: CampanhaWithEmpresa[]
  ticketsAbertos: Ticket[]
  allTickets: Ticket[]
  financialSummary: FinancialSummary | null
  activities: AuditLog[]
  notifications: Notification[]
}

interface AdminDashboardLoading {
  stats: boolean
  advancedStats: boolean
  empresas: boolean
  motoristas: boolean
  campanhasPendentes: boolean
  campanhasAtivas: boolean
  ticketsAbertos: boolean
  allTickets: boolean
  financial: boolean
  activities: boolean
  notifications: boolean
}

/**
 * Hook otimizado que usa useQueries para fazer batch requests
 * Reduz número de chamadas e melhora performance
 */
export const useAdminDashboardData = () => {
  // Force HMR Update
  const { user } = useAuth()

  const queries = useQueries({
    queries: [
      // 1. Estatísticas básicas
      {
        queryKey: ['admin-stats'],
        queryFn: async () => {
          const { data, error } = await supabase.rpc('get_admin_stats')
          if (error) throw error
          return (data?.[0] as AdminStats) || null
        },
        staleTime: 30000, // 30 segundos
        gcTime: 5 * 60 * 1000, // 5 minutos
      },
      // 2. Estatísticas avançadas
      {
        queryKey: ['admin-advanced-stats'],
        queryFn: async () => {
          const { data, error } = await supabase.rpc('get_advanced_stats')
          if (error) throw error
          return (data?.[0] as AdvancedStats) || null
        },
        staleTime: 30000,
        gcTime: 5 * 60 * 1000,
      },
      // 3. Empresas pendentes
      {
        queryKey: ['empresas', { status: 'aguardando_aprovacao' }],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .eq('status', 'aguardando_aprovacao')
            .order('created_at', { ascending: false })
            .limit(10)
          if (error) throw error
          return (data || []) as Empresa[]
        },
        staleTime: 10000, // 10 segundos - dados mais dinâmicos
        gcTime: 2 * 60 * 1000,
      },
      // 4. Motoristas pendentes
      {
        queryKey: ['motoristas', { status: 'aguardando_aprovacao' }],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('motoristas')
            .select('*')
            .eq('status', 'aguardando_aprovacao')
            .order('created_at', { ascending: false })
            .limit(10)
          if (error) throw error
          return (data || []) as Motorista[]
        },
        staleTime: 10000,
        gcTime: 2 * 60 * 1000,
      },
      // 5. Campanhas pendentes
      {
        queryKey: ['campanhas', { status: 'em_analise' }],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('campanhas')
            .select('*')
            .eq('status', 'em_analise')
            .order('created_at', { ascending: false })
            .limit(10)
          if (error) throw error
          return (data || []) as Campanha[]
        },
        staleTime: 10000,
        gcTime: 2 * 60 * 1000,
      },
      // 6. Campanhas ativas
      {
        queryKey: ['campanhas', { status: 'ativa' }],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('campanhas')
            .select('*, empresa:empresas(*)')
            .eq('status', 'ativa')
            .order('created_at', { ascending: false })
            .limit(50)
          if (error) throw error
          return (data || []) as CampanhaWithEmpresa[]
        },
        staleTime: 30000,
        gcTime: 5 * 60 * 1000,
      },
      // 7. Tickets abertos
      {
        queryKey: ['tickets', { status: 'aberto' }],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('status', 'aberto')
            .order('criado_em', { ascending: false })
          if (error) throw error
          return (data || []) as Ticket[]
        },
        staleTime: 10000,
        gcTime: 2 * 60 * 1000,
      },
      // 8. Todos os tickets (para gráfico)
      {
        queryKey: ['tickets', 'all'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .order('criado_em', { ascending: false })
            .limit(100)
          if (error) throw error
          return (data || []) as Ticket[]
        },
        staleTime: 30000,
        gcTime: 5 * 60 * 1000,
      },
      // 9. Resumo financeiro
      {
        queryKey: ['financial-summary'],
        queryFn: async () => {
          // Usar o service existente
          const { pagamentoService } = await import('@/services/pagamentoService')
          const summary = await pagamentoService.getFinancialSummary()
          return summary
        },
        staleTime: 60000, // 1 minuto - dados financeiros mudam menos
        gcTime: 10 * 60 * 1000,
      },
      // 10. Atividades recentes
      {
        queryKey: ['audit-logs', { limit: 10 }],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)
          if (error) throw error
          return (data || []) as AuditLog[]
        },
        staleTime: 10000,
        gcTime: 2 * 60 * 1000,
      },
      // 11. Notificações não lidas
      {
        queryKey: ['notifications', 'unread'],
        queryFn: async () => {
          if (!user?.id) return []
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(10)
          if (error) throw error
          return (data || []) as Notification[]
        },
        staleTime: 5000, // 5 segundos - notificações são muito dinâmicas
        gcTime: 1 * 60 * 1000,
        enabled: !!user?.id, // Só busca se houver usuário
      },
    ],
  })

  // Extrair dados e estados de loading
  const [
    statsResult,
    advancedStatsResult,
    empresasResult,
    motoristasResult,
    campanhasPendentesResult,
    campanhasAtivasResult,
    ticketsAbertosResult,
    allTicketsResult,
    financialResult,
    activitiesResult,
    notificationsResult,
  ] = queries

  const data: AdminDashboardData = {
    stats: statsResult.data || null,
    advancedStats: advancedStatsResult.data || null,
    empresasPendentes: empresasResult.data || [],
    motoristasPendentes: motoristasResult.data || [],
    campanhasPendentes: campanhasPendentesResult.data || [],
    campanhasAtivas: campanhasAtivasResult.data || [],
    ticketsAbertos: ticketsAbertosResult.data || [],
    allTickets: allTicketsResult.data || [],
    financialSummary: financialResult.data || null,
    activities: activitiesResult.data || [],
    notifications: notificationsResult.data || [],
  }

  const loading: AdminDashboardLoading = {
    stats: statsResult.isLoading,
    advancedStats: advancedStatsResult.isLoading,
    empresas: empresasResult.isLoading,
    motoristas: motoristasResult.isLoading,
    campanhasPendentes: campanhasPendentesResult.isLoading,
    campanhasAtivas: campanhasAtivasResult.isLoading,
    ticketsAbertos: ticketsAbertosResult.isLoading,
    allTickets: allTicketsResult.isLoading,
    financial: financialResult.isLoading,
    activities: activitiesResult.isLoading,
    notifications: notificationsResult.isLoading,
  }

  const errors = {
    stats: statsResult.error,
    advancedStats: advancedStatsResult.error,
    empresas: empresasResult.error,
    motoristas: motoristasResult.error,
    campanhasPendentes: campanhasPendentesResult.error,
    campanhasAtivas: campanhasAtivasResult.error,
    ticketsAbertos: ticketsAbertosResult.error,
    allTickets: allTicketsResult.error,
    financial: financialResult.error,
    activities: activitiesResult.error,
    notifications: notificationsResult.error,
  }

  // Função para refetch de todas as queries
  const refetchAll = () => {
    queries.forEach((query) => query.refetch())
  }

  // Função para refetch específica
  const refetch = {
    stats: () => statsResult.refetch(),
    advancedStats: () => advancedStatsResult.refetch(),
    empresas: () => empresasResult.refetch(),
    motoristas: () => motoristasResult.refetch(),
    campanhasPendentes: () => campanhasPendentesResult.refetch(),
    campanhasAtivas: () => campanhasAtivasResult.refetch(),
    ticketsAbertos: () => ticketsAbertosResult.refetch(),
    allTickets: () => allTicketsResult.refetch(),
    financial: () => financialResult.refetch(),
    activities: () => activitiesResult.refetch(),
    notifications: () => notificationsResult.refetch(),
  }

  // Loading geral (true se qualquer query estiver carregando)
  const isLoading = Object.values(loading).some((l) => l)

  return {
    data,
    loading,
    errors,
    isLoading,
    refetch,
    refetchAll,
  }
}
