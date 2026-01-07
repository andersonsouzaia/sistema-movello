import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useEmpresaStats } from '@/hooks/useEmpresaStats'
import { useEmpresaCampanhas } from '@/hooks/useEmpresaCampanhas'
import { useEmpresaMetricasDiarias } from '@/hooks/useEmpresaMetricas'
import { useRascunhos } from '@/hooks/useEmpresaRascunhos'
import { RascunhosList } from '@/components/empresa/RascunhosList'
import { InsightsWidget } from '@/components/empresa/InsightsWidget'
import { useEmpresaMetricasConsolidadas } from '@/hooks/useEmpresaMetricas'
import { lazy, Suspense } from 'react'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import { useIsMobile } from '@/hooks/use-mobile'

// Lazy load do mapa para melhor performance
const MapContainer = lazy(() => import('react-leaflet').then((mod) => ({ default: mod.MapContainer })))
const TileLayer = lazy(() => import('react-leaflet').then((mod) => ({ default: mod.TileLayer })))
const Circle = lazy(() => import('react-leaflet').then((mod) => ({ default: mod.Circle })))
const Marker = lazy(() => import('react-leaflet').then((mod) => ({ default: mod.Marker })))
import { StatsChart } from '@/components/admin/StatsChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Building2, CheckCircle2, TrendingUp, DollarSign, Clock, Plus, ArrowRight, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function EmpresaDashboard() {
  const isMobile = useIsMobile()
  const { empresa, profile } = useAuth()
  const navigate = useNavigate()
  const { stats, loading: statsLoading, refetch: refetchStats } = useEmpresaStats()
  // Otimização: usar apenas uma chamada e filtrar no frontend
  const { campanhas, loading: campanhasLoading } = useEmpresaCampanhas({})
  const { metricas: metricasDiarias, loading: metricasLoading } = useEmpresaMetricasDiarias(30)
  const { metricas: metricasConsolidadas } = useEmpresaMetricasConsolidadas()
  const { rascunhos } = useRascunhos()

  // Filtrar campanhas no frontend para evitar múltiplas chamadas
  const campanhasAtivas = useMemo(() => 
    campanhas.filter(c => c.status === 'ativa'), 
    [campanhas]
  )
  const campanhasPendentes = useMemo(() => 
    campanhas.filter(c => c.status === 'em_analise'), 
    [campanhas]
  )

  const getStatusBadge = () => {
    if (!empresa) return null

    const statusMap = {
      aguardando_aprovacao: { label: 'Aguardando Aprovação', variant: 'default' as const },
      ativa: { label: 'Ativa', variant: 'default' as const },
      bloqueada: { label: 'Bloqueada', variant: 'destructive' as const },
      suspensa: { label: 'Suspensa', variant: 'destructive' as const },
    }

    const status = statusMap[empresa.status] || statusMap.aguardando_aprovacao

    return (
      <Badge variant={status.variant} className="ml-2">
        {status.label}
      </Badge>
    )
  }

  // Preparar dados para gráfico de performance (últimos 30 dias) - DADOS REAIS
  const performanceChartData = useMemo(() => {
    if (!metricasDiarias || metricasDiarias.length === 0) {
      // Se não há dados, retornar array vazio ou com zeros
      return Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        return {
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          visualizacoes: 0,
          gasto: 0,
        }
      })
    }

    // Criar mapa de dados por data
    const dadosPorData = new Map<string, { visualizacoes: number; gasto: number }>()
    
    metricasDiarias.forEach((metrica) => {
      const dataKey = new Date(metrica.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      dadosPorData.set(dataKey, {
        visualizacoes: metrica.visualizacoes,
        gasto: metrica.gasto,
      })
    })

    // Preencher últimos 30 dias
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      const dataKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      const dados = dadosPorData.get(dataKey) || { visualizacoes: 0, gasto: 0 }
      
      return {
        date: dataKey,
        visualizacoes: dados.visualizacoes,
        gasto: dados.gasto,
      }
    })
  }, [metricasDiarias])

  // Top 5 campanhas por orçamento
  const topCampanhas = useMemo(() => {
    return campanhas
      .slice(0, 5)
      .map((campanha) => ({
        id: campanha.id,
        titulo: campanha.titulo,
        orcamento: campanha.orcamento,
        utilizado: campanha.orcamento_utilizado,
        status: campanha.status,
      }))
      .sort((a, b) => b.orcamento - a.orcamento)
  }, [campanhas])

  // Campanhas próximas do fim (últimos 7 dias)
  const campanhasProximasFim = useMemo(() => {
    const hoje = new Date()
    const em7Dias = new Date()
    em7Dias.setDate(hoje.getDate() + 7)

    return campanhasAtivas.filter((campanha) => {
      const dataFim = new Date(campanha.data_fim)
      return dataFim >= hoje && dataFim <= em7Dias
    })
  }, [campanhasAtivas])

  const statsCards = useMemo(() => {
    if (!stats) return []

    return [
      {
        label: 'Total de Campanhas',
        value: stats.total_campanhas.toString(),
        icon: Building2,
        color: 'primary',
        description: 'Campanhas criadas',
      },
      {
        label: 'Campanhas Ativas',
        value: stats.campanhas_ativas.toString(),
        icon: CheckCircle2,
        color: 'accent',
        description: 'Em exibição',
      },
      {
        label: 'Total de Visualizações',
        value: stats.total_visualizacoes.toLocaleString('pt-BR'),
        icon: TrendingUp,
        color: 'primary',
        description: 'Total de visualizações',
      },
      {
        label: 'Gasto Total',
        value: formatCurrency(stats.total_gasto),
        icon: DollarSign,
        color: 'accent',
        description: 'Investimento total',
      },
      {
        label: 'Saldo Disponível',
        value: formatCurrency(stats.saldo_disponivel),
        icon: DollarSign,
        color: 'primary',
        description: 'Saldo para novas campanhas',
      },
      {
        label: 'Campanhas Pendentes',
        value: stats.campanhas_pendentes.toString(),
        icon: Clock,
        color: 'accent',
        description: 'Aguardando aprovação',
      },
    ]
  }, [stats])

  return (
    <ProtectedRoute requiredUserType="empresa">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                Dashboard
                {getStatusBadge()}
              </h1>
              <p className="text-lg text-muted-foreground">
                Bem-vindo, {empresa?.nome_fantasia || empresa?.razao_social || profile?.nome || 'Empresa'}!
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/empresa/campanhas/nova')}
                className="gap-2"
                disabled={empresa?.status !== 'ativa'}
              >
                <Plus className="h-4 w-4" />
                Nova Campanha
              </Button>
              <Button
                variant="outline"
                onClick={() => refetchStats()}
                className="gap-2"
              >
                <Loader2 className={cn("h-4 w-4", statsLoading && "animate-spin")} />
                Atualizar
              </Button>
            </div>
          </motion.div>

          {/* Status Alert */}
          {empresa?.status === 'aguardando_aprovacao' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert className="border-primary/20 bg-primary/5">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <AlertDescription>
                  Sua conta está aguardando aprovação. Você terá acesso completo após a aprovação pela equipe Movello.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {empresa?.status === 'ativa' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert className="border-primary/20 bg-primary/5">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <AlertDescription>
                  Sua conta está ativa! Você pode criar campanhas e gerenciar seus anúncios.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Alertas Proativos */}
          {empresa?.status === 'ativa' && (
            <>
              {campanhasProximasFim.length > 0 && (
                <Alert className="border-yellow-500/20 bg-yellow-500/5">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <AlertDescription>
                    Você tem {campanhasProximasFim.length} campanha(s) que termina(m) nos próximos 7 dias.
                    <Button
                      variant="link"
                      className="ml-2 p-0 h-auto"
                      onClick={() => navigate('/empresa/campanhas')}
                    >
                      Ver campanhas
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {stats && stats.saldo_disponivel < 100 && (
                <Alert className="border-yellow-500/20 bg-yellow-500/5">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <AlertDescription>
                    Seu saldo está baixo. Considere adicionar mais créditos para continuar suas campanhas.
                    <Button
                      variant="link"
                      className="ml-2 p-0 h-auto"
                      onClick={() => navigate('/empresa/pagamentos')}
                    >
                      Adicionar saldo
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {campanhasPendentes.length > 0 && (
                <Alert className="border-blue-500/20 bg-blue-500/5">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  <AlertDescription>
                    Você tem {campanhasPendentes.length} campanha(s) aguardando aprovação.
                    <Button
                      variant="link"
                      className="ml-2 p-0 h-auto"
                      onClick={() => navigate('/empresa/campanhas')}
                    >
                      Ver campanhas
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Cards de Estatísticas */}
          {statsLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="card-premium p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {statsCards.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  >
                    <Card className="card-premium p-6 hover:shadow-xl transition-all duration-300">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center",
                          stat.color === 'primary' ? "bg-primary/10" : "bg-accent/10"
                        )}>
                          <Icon className={cn(
                            "h-6 w-6",
                            stat.color === 'primary' ? "text-primary" : "text-accent"
                          )} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-1">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Rascunhos Pendentes */}
          {empresa?.status === 'ativa' && rascunhos.length > 0 && (
            <RascunhosList onAtivar={refetchStats} />
          )}

          {/* Widget de Insights */}
          {empresa?.status === 'ativa' && metricasConsolidadas && (
            <InsightsWidget metricas={metricasConsolidadas.periodo_atual} />
          )}

          {/* Gráficos */}
          {empresa?.status === 'ativa' && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Gráfico de Performance */}
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Performance (Últimos 30 dias)</CardTitle>
                  <CardDescription>Visualizações e gastos diários - Dados reais</CardDescription>
                </CardHeader>
                <CardContent>
                  {metricasLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                      <LineChart data={performanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="visualizacoes"
                          stroke="#8884d8"
                          name="Visualizações"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="gasto"
                          stroke="#82ca9d"
                          name="Gasto (R$)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Campanhas */}
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Top Campanhas</CardTitle>
                  <CardDescription>Campanhas com maior orçamento</CardDescription>
                </CardHeader>
                <CardContent>
                  {topCampanhas.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma campanha ainda
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {topCampanhas.map((campanha) => (
                        <div
                          key={campanha.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/empresa/campanhas/${campanha.id}`)}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{campanha.titulo}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(campanha.utilizado)} de {formatCurrency(campanha.orcamento)}
                            </p>
                          </div>
                          <Badge variant="secondary" className="ml-2">
                            {campanha.status}
                          </Badge>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/empresa/campanhas')}
                      >
                        Ver todas as campanhas
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Widget Geográfico - Campanhas por Nicho */}
          {empresa?.status === 'ativa' && campanhas.length > 0 && (
            <Card className="card-premium">
              <CardHeader>
                <CardTitle>Campanhas por Nicho</CardTitle>
                <CardDescription>Distribuição de campanhas por segmento</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const nichosCount: Record<string, number> = {}
                  campanhas.forEach((campanha) => {
                    if (campanha.nicho) {
                      nichosCount[campanha.nicho] = (nichosCount[campanha.nicho] || 0) + 1
                    }
                  })
                  const nichosData = Object.entries(nichosCount).map(([nicho, count]) => ({
                    nicho: nicho.charAt(0).toUpperCase() + nicho.slice(1),
                    count,
                  }))
                  
                  return nichosData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
                      <BarChart data={nichosData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nicho" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma campanha com nicho definido
                    </p>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* Ações Rápidas */}
          {empresa?.status === 'ativa' && (
            <Card className="card-premium">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Atalhos para funcionalidades principais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Button
                    variant="outline"
                    className="h-auto flex-col p-6"
                    onClick={() => navigate('/empresa/campanhas/nova')}
                  >
                    <Plus className="h-8 w-8 mb-2" />
                    <span className="font-medium">Criar Campanha</span>
                    <span className="text-xs text-muted-foreground mt-1">Nova campanha publicitária</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto flex-col p-6"
                    onClick={() => navigate('/empresa/pagamentos')}
                  >
                    <DollarSign className="h-8 w-8 mb-2" />
                    <span className="font-medium">Adicionar Saldo</span>
                    <span className="text-xs text-muted-foreground mt-1">Recarregar créditos</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto flex-col p-6"
                    onClick={() => navigate('/empresa/campanhas')}
                  >
                    <Building2 className="h-8 w-8 mb-2" />
                    <span className="font-medium">Ver Campanhas</span>
                    <span className="text-xs text-muted-foreground mt-1">Gerenciar campanhas</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações da Empresa */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="card-premium">
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>Dados cadastrais da sua empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Razão Social</p>
                  <p className="text-sm">{empresa?.razao_social}</p>
                </div>
                {empresa?.nome_fantasia && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome Fantasia</p>
                    <p className="text-sm">{empresa.nome_fantasia}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                  <p className="text-sm">{empresa?.cnpj}</p>
                </div>
                {empresa?.instagram && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Instagram</p>
                    <p className="text-sm">{empresa.instagram}</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigate('/empresa/perfil')}
                  className="mt-4"
                >
                  Editar Perfil
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
