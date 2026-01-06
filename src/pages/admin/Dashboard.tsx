import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminStats } from '@/hooks/useAdminStats'
import { useAdvancedStats } from '@/hooks/useAdvancedStats'
import { useRecentActivity } from '@/hooks/useAuditLogs'
import { useUnreadNotifications } from '@/hooks/useNotifications'
import { useEmpresas } from '@/hooks/useEmpresas'
import { useMotoristas } from '@/hooks/useMotoristas'
import { useCampanhas } from '@/hooks/useCampanhas'
import { useTickets } from '@/hooks/useTickets'
import { useFinancialSummary } from '@/hooks/usePagamentos'
import { adminService } from '@/services/adminService'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { StatsChart } from '@/components/admin/StatsChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Car, AlertCircle, Users, CheckCircle2, ArrowRight, Loader2, TrendingUp, Activity, Bell, Megaphone, LifeBuoy, DollarSign, Clock, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { formatCNPJ } from '@/lib/utils/formatters'
import { formatDate } from '@/lib/utils/formatters'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const { stats, loading: statsLoading, refetch: refetchStats } = useAdminStats()
  const { stats: advancedStats, loading: advancedStatsLoading } = useAdvancedStats()
  const { activities, loading: activitiesLoading } = useRecentActivity(10)
  const { notifications, loading: notificationsLoading } = useUnreadNotifications()
  const { empresas: empresasPendentes, loading: empresasLoading, refetch: refetchEmpresas } = useEmpresas({ 
    status: 'aguardando_aprovacao' 
  })
  const { motoristas: motoristasPendentes, loading: motoristasLoading, refetch: refetchMotoristas } = useMotoristas({ 
    status: 'aguardando_aprovacao' 
  })
  const { campanhas: campanhasPendentes, loading: campanhasLoading } = useCampanhas({ status: 'em_analise' })
  const { campanhas: campanhasAtivas, loading: campanhasAtivasLoading } = useCampanhas({ status: 'ativa' })
  const { tickets: ticketsAbertos, loading: ticketsLoading } = useTickets({ status: 'aberto' })
  const { tickets: allTickets, loading: allTicketsLoading } = useTickets({})
  const { summary: financialSummary, loading: financialLoading } = useFinancialSummary()

  // Preparar dados para gráfico de crescimento
  const chartData = useMemo(() => {
    if (!advancedStats) return []
    
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return {
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        empresas: Math.round((advancedStats.empresas_crescimento_30d || 0) / 30),
        motoristas: Math.round((advancedStats.motoristas_crescimento_30d || 0) / 30),
        aprovacoes: Math.round(((advancedStats.empresas_aprovadas_30d || 0) + (advancedStats.motoristas_aprovados_30d || 0)) / 30),
      }
    })
  }, [advancedStats])

  // Top 5 campanhas por performance
  const topCampanhas = useMemo(() => {
    return campanhasAtivas
      .slice(0, 5)
      .map((campanha) => ({
        id: campanha.id,
        titulo: campanha.titulo,
        empresa: campanha.empresa?.razao_social || 'N/A',
        orcamento: campanha.orcamento,
        utilizado: campanha.orcamento_utilizado,
        performance: campanha.orcamento > 0 ? (campanha.orcamento_utilizado / campanha.orcamento) * 100 : 0,
      }))
      .sort((a, b) => b.performance - a.performance)
  }, [campanhasAtivas])

  // Dados para gráfico de receitas vs despesas
  const financialChartData = useMemo(() => {
    if (!financialSummary) return []
    
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      return {
        mes: date.toLocaleDateString('pt-BR', { month: 'short' }),
        receitas: Math.round((financialSummary.total_receitas || 0) / 12),
        despesas: Math.round((financialSummary.total_despesas || 0) / 12),
      }
    })
  }, [financialSummary])

  // Dados para gráfico de tickets por status
  const ticketsChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      date.setHours(0, 0, 0, 0)
      return date
    })

    return last7Days.map((date) => {
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)

      const ticketsDoDia = allTickets.filter((ticket) => {
        const ticketDate = new Date(ticket.criado_em)
        ticketDate.setHours(0, 0, 0, 0)
        return ticketDate >= date && ticketDate < nextDay
      })

      return {
        dia: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        aberto: ticketsDoDia.filter((t) => t.status === 'aberto').length,
        em_andamento: ticketsDoDia.filter((t) => t.status === 'em_andamento').length,
        resolvido: ticketsDoDia.filter((t) => t.status === 'resolvido').length,
        fechado: ticketsDoDia.filter((t) => t.status === 'fechado').length,
      }
    })
  }, [allTickets])

  const handleApproveEmpresa = async (empresaId: string) => {
    if (!user?.id) return
    
    try {
      const result = await adminService.approveEmpresa({
        userId: empresaId,
        adminId: user.id,
      })

      if (result.success) {
        toast.success('Empresa aprovada com sucesso!')
        refetchEmpresas()
        refetchStats()
      }
    } catch (error) {
      toast.error('Erro ao aprovar empresa')
    }
  }

  const handleApproveMotorista = async (motoristaId: string) => {
    if (!user?.id) return
    
    try {
      const result = await adminService.approveMotorista({
        userId: motoristaId,
        adminId: user.id,
      })

      if (result.success) {
        toast.success('Motorista aprovado com sucesso!')
        refetchMotoristas()
        refetchStats()
      }
    } catch (error) {
      toast.error('Erro ao aprovar motorista')
    }
  }

  const totalPendencias = (stats?.empresas_pendentes || 0) + (stats?.motoristas_pendentes || 0) + campanhasPendentes.length

  // Alertas proativos
  const alertas = useMemo(() => {
    const alerts = []
    
    if (campanhasPendentes.length > 0) {
      alerts.push({
        tipo: 'campanha' as const,
        titulo: `${campanhasPendentes.length} campanha(s) aguardando aprovação`,
        descricao: 'Campanhas precisam de revisão antes de serem ativadas',
        link: '/admin/campanhas',
        cor: 'yellow' as const,
        prioridade: 'alta' as const,
        icon: Megaphone,
      })
    }
    
    if (ticketsAbertos.length > 0) {
      alerts.push({
        tipo: 'ticket' as const,
        titulo: `${ticketsAbertos.length} ticket(s) aberto(s) sem resposta`,
        descricao: 'Tickets aguardando atendimento',
        link: '/admin/suporte',
        cor: 'red' as const,
        prioridade: 'urgente' as const,
        icon: LifeBuoy,
      })
    }
    
    if (financialSummary && financialSummary.pagamentos_pendentes > 0) {
      alerts.push({
        tipo: 'pagamento' as const,
        titulo: `${financialSummary.pagamentos_pendentes} pagamento(s) pendente(s)`,
        descricao: 'Pagamentos aguardando processamento',
        link: '/admin/pagamentos',
        cor: 'blue' as const,
        prioridade: 'media' as const,
        icon: DollarSign,
      })
    }
    
    if (financialSummary && financialSummary.repasses_pendentes > 0) {
      alerts.push({
        tipo: 'repasse' as const,
        titulo: `${financialSummary.repasses_pendentes} repasse(s) pendente(s)`,
        descricao: 'Repasses aguardando processamento',
        link: '/admin/pagamentos',
        cor: 'green' as const,
        prioridade: 'media' as const,
        icon: DollarSign,
      })
    }
    
    if (empresasPendentes.length > 0) {
      alerts.push({
        tipo: 'empresa' as const,
        titulo: `${empresasPendentes.length} empresa(s) aguardando aprovação`,
        descricao: 'Novas empresas precisam de validação',
        link: '/admin/empresas',
        cor: 'yellow' as const,
        prioridade: 'alta' as const,
        icon: Building2,
      })
    }
    
    if (motoristasPendentes.length > 0) {
      alerts.push({
        tipo: 'motorista' as const,
        titulo: `${motoristasPendentes.length} motorista(s) aguardando aprovação`,
        descricao: 'Novos motoristas precisam de validação',
        link: '/admin/motoristas',
        cor: 'yellow' as const,
        prioridade: 'alta' as const,
        icon: Car,
      })
    }
    
    return alerts
  }, [campanhasPendentes, ticketsAbertos, financialSummary, empresasPendentes, motoristasPendentes])

  const isLoading = statsLoading || advancedStatsLoading || empresasLoading || motoristasLoading || campanhasLoading

  return (
    <ProtectedRoute requiredUserType="admin">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                Dashboard Administrativo
              </h1>
              <p className="text-lg text-muted-foreground">
                Bem-vindo, {profile?.nome || 'Administrador'}!
              </p>
            </div>
            {totalPendencias > 0 && (
              <Badge variant="destructive" className="text-lg px-4 py-2">
                {totalPendencias} pendência{totalPendencias !== 1 ? 's' : ''}
              </Badge>
            )}
          </motion.div>

          {/* Alertas Proativos - Destaque no topo */}
          {alertas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <CardTitle className="text-lg">Ações Necessárias</CardTitle>
                    </div>
                    <Badge variant="secondary">{alertas.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {alertas.slice(0, 6).map((alerta, idx) => {
                      const Icon = alerta.icon
                      const priorityColors = {
                        urgente: 'border-red-500 bg-red-50 dark:bg-red-950/20',
                        alta: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
                        media: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
                      }
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all group",
                            priorityColors[alerta.prioridade] || 'border-border bg-card'
                          )}
                          onClick={() => alerta.link && navigate(alerta.link)}
                        >
                          <div className="p-2 rounded-lg bg-background/50 group-hover:bg-background transition-colors">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm">{alerta.titulo}</p>
                              <Badge 
                                variant={alerta.prioridade === 'urgente' ? 'destructive' : 'secondary'} 
                                className="text-xs"
                              >
                                {alerta.prioridade}
                              </Badge>
                            </div>
                            {alerta.descricao && (
                              <p className="text-xs text-muted-foreground">{alerta.descricao}</p>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Cards de Estatísticas Principais - Grid melhorado */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card className="card-premium cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/admin/empresas')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Empresas</CardTitle>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{stats?.total_empresas || 0}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{stats?.empresas_ativas || 0} ativas</span>
                      {stats?.empresas_pendentes > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {stats.empresas_pendentes} pendentes
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card className="card-premium cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/admin/motoristas')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Motoristas</CardTitle>
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Car className="h-5 w-5 text-accent" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{stats?.total_motoristas || 0}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{stats?.motoristas_aprovados || 0} aprovados</span>
                      {stats?.motoristas_pendentes > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {stats.motoristas_pendentes} pendentes
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card className="card-premium cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/admin/campanhas')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Campanhas</CardTitle>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{stats?.campanhas_ativas || 0}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{campanhasAtivas.length} ativas</span>
                      {campanhasPendentes.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {campanhasPendentes.length} pendentes
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card className="card-premium cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/admin/suporte')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Tickets</CardTitle>
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <LifeBuoy className="h-5 w-5 text-accent" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{allTickets.length}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{ticketsAbertos.length} abertos</span>
                      {ticketsAbertos.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {ticketsAbertos.length} sem resposta
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Seção Principal: Gráficos e Atividades */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Gráfico de Crescimento - 2 colunas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="lg:col-span-2"
            >
              <Card className="card-premium h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Crescimento (30 dias)
                  </CardTitle>
                  <CardDescription>Evolução de empresas, motoristas e aprovações</CardDescription>
                </CardHeader>
                <CardContent>
                  {advancedStatsLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <StatsChart
                      data={chartData}
                      loading={false}
                      title=""
                      description=""
                      showLegend={true}
                      dataKeys={['empresas', 'motoristas', 'aprovacoes']}
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Atividades Recentes - 1 coluna */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
            >
              <ActivityFeed activities={activities} loading={activitiesLoading} limit={8} />
            </motion.div>
          </div>

          {/* Seção Financeira e Performance */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Resumo Financeiro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Card className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Resumo Financeiro
                    </CardTitle>
                    <CardDescription>Últimos 30 dias</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin/pagamentos')}>
                    Ver Detalhes
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {financialLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : financialSummary ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                          <p className="text-xs text-muted-foreground mb-1">Receitas</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(financialSummary.total_receitas)}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                          <p className="text-xs text-muted-foreground mb-1">Despesas</p>
                          <p className="text-2xl font-bold text-red-600">
                            {formatCurrency(financialSummary.total_despesas)}
                          </p>
                        </div>
                        <div className={cn(
                          "p-4 rounded-lg border",
                          financialSummary.saldo >= 0 
                            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                        )}>
                          <p className="text-xs text-muted-foreground mb-1">Saldo</p>
                          <p className={cn(
                            "text-2xl font-bold",
                            financialSummary.saldo >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {formatCurrency(financialSummary.saldo)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Pagamentos Pendentes</p>
                          <p className="text-xl font-semibold">{financialSummary.pagamentos_pendentes}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Repasses Pendentes</p>
                          <p className="text-xl font-semibold">{financialSummary.repasses_pendentes}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                      Nenhum dado financeiro disponível
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Campanhas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.55 }}
            >
              <Card className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5" />
                      Top Campanhas
                    </CardTitle>
                    <CardDescription>Melhor performance de orçamento</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin/campanhas')}>
                    Ver Todas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {campanhasAtivasLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : topCampanhas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <Megaphone className="h-12 w-12 mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma campanha ativa</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topCampanhas.map((campanha, idx) => (
                        <div
                          key={campanha.id}
                          className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/admin/campanhas/${campanha.id}`)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  #{idx + 1}
                                </Badge>
                                <p className="font-semibold text-sm truncate">{campanha.titulo}</p>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{campanha.empresa}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Utilização:</span>
                              <span className="font-semibold">{campanha.performance.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full transition-all"
                                style={{ width: `${Math.min(campanha.performance, 100)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatCurrency(campanha.utilizado)}</span>
                              <span>de {formatCurrency(campanha.orcamento)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Gráfico de Tickets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="relative z-0"
          >
            <Card className="card-premium overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LifeBuoy className="h-5 w-5" />
                    Tickets por Status
                  </CardTitle>
                  <CardDescription>Últimos 7 dias</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/suporte')}>
                  Ver Todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pb-6">
                {allTicketsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="h-64 w-full overflow-hidden relative" style={{ minHeight: '256px', maxHeight: '256px' }}>
                    <StatsChart
                      data={ticketsChartData}
                      loading={false}
                      title=""
                      description=""
                      showLegend={true}
                      dataKeys={['aberto', 'em_andamento', 'resolvido', 'fechado']}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pendências - Layout melhorado */}
          <div className="grid gap-6 lg:grid-cols-3 relative z-10">
            {/* Empresas Pendentes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.65 }}
            >
              <Card className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Empresas Pendentes
                    </CardTitle>
                    <CardDescription>
                      {empresasPendentes.length} aguardando aprovação
                    </CardDescription>
                  </div>
                  {empresasPendentes.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin/empresas')}
                    >
                      Ver Todas
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {empresasLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : empresasPendentes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma empresa pendente</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {empresasPendentes.slice(0, 4).map((empresa) => (
                        <div
                          key={empresa.id}
                          className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate mb-1">{empresa.razao_social}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatCNPJ(empresa.cnpj)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(empresa.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApproveEmpresa(empresa.id)
                              }}
                              className="flex-1"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/admin/empresas/${empresa.id}`)
                              }}
                            >
                              Ver
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Motoristas Pendentes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <Card className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Motoristas Pendentes
                    </CardTitle>
                    <CardDescription>
                      {motoristasPendentes.length} aguardando aprovação
                    </CardDescription>
                  </div>
                  {motoristasPendentes.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin/motoristas')}
                    >
                      Ver Todos
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {motoristasLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : motoristasPendentes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mb-2 opacity-50" />
                      <p className="text-sm">Nenhum motorista pendente</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {motoristasPendentes.slice(0, 4).map((motorista) => (
                        <div
                          key={motorista.id}
                          className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate mb-1">
                                {motorista.user_nome || 'Motorista'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {motorista.veiculo}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(motorista.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApproveMotorista(motorista.id)
                              }}
                              className="flex-1"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/admin/motoristas/${motorista.id}`)
                              }}
                            >
                              Ver
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Campanhas Pendentes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.75 }}
            >
              <Card className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Megaphone className="h-5 w-5" />
                      Campanhas Pendentes
                    </CardTitle>
                    <CardDescription>
                      {campanhasPendentes.length} aguardando aprovação
                    </CardDescription>
                  </div>
                  {campanhasPendentes.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin/campanhas')}
                    >
                      Ver Todas
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {campanhasLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : campanhasPendentes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma campanha pendente</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {campanhasPendentes.slice(0, 4).map((campanha) => (
                        <div
                          key={campanha.id}
                          className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/admin/campanhas/${campanha.id}`)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate mb-1">{campanha.titulo}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {campanha.empresa?.razao_social || 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatCurrency(campanha.orcamento)}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Notificações Não Lidas */}
          {notifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              <Card className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notificações Não Lidas
                    </CardTitle>
                    <CardDescription>
                      {notifications.length} notificação(ões) não lida(s)
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin/notificacoes')}>
                    Ver Todas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {notifications.slice(0, 4).map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => notification.link && navigate(notification.link)}
                      >
                        <div className="p-2 rounded-lg bg-background/50">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm mb-1">{notification.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
