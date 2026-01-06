import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Target, DollarSign, MousePointerClick, Eye, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import type { CampanhaMetricasConsolidadas, MetricaDiaria, KPIsMeta } from '@/types/database'

interface CampanhaMetricasProps {
  metricasConsolidadas: CampanhaMetricasConsolidadas | null
  metricasDiarias: MetricaDiaria[]
  kpisMeta?: KPIsMeta
  loading?: boolean
  className?: string
}

export function CampanhaMetricas({
  metricasConsolidadas,
  metricasDiarias,
  kpisMeta,
  loading = false,
  className,
}: CampanhaMetricasProps) {
  const metricas = metricasConsolidadas || {
    total_visualizacoes: 0,
    total_cliques: 0,
    total_conversoes: 0,
    total_gasto: 0,
    total_impressoes: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    cpa: 0,
    taxa_conversao: 0,
    tempo_medio_visualizacao: 0,
  }

  // Preparar dados para gráficos
  const chartData = useMemo(() => {
    return metricasDiarias.map((m) => ({
      data: new Date(m.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      visualizacoes: m.visualizacoes,
      gasto: m.gasto,
      cliques: m.cliques,
      conversoes: m.conversoes,
      ctr: m.ctr || 0,
      cpc: m.cpc || 0,
    }))
  }, [metricasDiarias])

  // Comparar com metas
  const comparacaoMetas = useMemo(() => {
    if (!kpisMeta) return null

    return {
      ctr: {
        atual: metricas.ctr,
        meta: kpisMeta.ctr || 0,
        diferenca: metricas.ctr - (kpisMeta.ctr || 0),
      },
      cpc: {
        atual: metricas.cpc,
        meta: kpisMeta.cpc || 0,
        diferenca: (kpisMeta.cpc || 0) - metricas.cpc, // Menor é melhor
      },
      visualizacoes: {
        atual: metricas.total_visualizacoes,
        meta: kpisMeta.visualizacoes || 0,
        diferenca: metricas.total_visualizacoes - (kpisMeta.visualizacoes || 0),
      },
      conversoes: {
        atual: metricas.total_conversoes,
        meta: kpisMeta.conversoes || 0,
        diferenca: metricas.total_conversoes - (kpisMeta.conversoes || 0),
      },
    }
  }, [metricas, kpisMeta])

  const getTrendIcon = (valor: number) => {
    if (valor > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (valor < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getTrendColor = (valor: number, invertido: boolean = false) => {
    const positivo = invertido ? valor < 0 : valor > 0
    return positivo ? 'text-green-500' : valor < 0 ? 'text-red-500' : 'text-gray-500'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Métricas da Campanha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Cards de Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPA</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metricas.cpa)}</div>
            <p className="text-xs text-muted-foreground">Custo por Aquisição</p>
            {comparacaoMetas?.cpc && (
              <div className={cn("flex items-center gap-1 mt-1", getTrendColor(comparacaoMetas.cpc.diferenca, true))}>
                {getTrendIcon(comparacaoMetas.cpc.diferenca)}
                <span className="text-xs">
                  {comparacaoMetas.cpc.diferenca > 0 ? 'Abaixo da meta' : comparacaoMetas.cpc.diferenca < 0 ? 'Acima da meta' : 'Na meta'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPM</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metricas.cpm)}</div>
            <p className="text-xs text-muted-foreground">Custo por Mil Impressões</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTR</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.ctr.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Taxa de Clique</p>
            {comparacaoMetas?.ctr && (
              <div className={cn("flex items-center gap-1 mt-1", getTrendColor(comparacaoMetas.ctr.diferenca))}>
                {getTrendIcon(comparacaoMetas.ctr.diferenca)}
                <span className="text-xs">
                  {comparacaoMetas.ctr.diferenca > 0 ? 'Acima da meta' : comparacaoMetas.ctr.diferenca < 0 ? 'Abaixo da meta' : 'Na meta'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPC</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metricas.cpc)}</div>
            <p className="text-xs text-muted-foreground">Custo por Clique</p>
            {comparacaoMetas?.cpc && (
              <div className={cn("flex items-center gap-1 mt-1", getTrendColor(comparacaoMetas.cpc.diferenca, true))}>
                {getTrendIcon(comparacaoMetas.cpc.diferenca)}
                <span className="text-xs">
                  {comparacaoMetas.cpc.diferenca > 0 ? 'Abaixo da meta' : comparacaoMetas.cpc.diferenca < 0 ? 'Acima da meta' : 'Na meta'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Métricas Secundárias */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.total_visualizacoes.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Total de visualizações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.total_cliques.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Total de cliques</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.total_conversoes.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              Taxa: {metricas.taxa_conversao.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      {chartData.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Performance Temporal</CardTitle>
              <CardDescription>Visualizações e gastos ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CTR e CPC</CardTitle>
              <CardDescription>Taxa de clique e custo por clique</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="ctr" fill="#8884d8" name="CTR (%)" />
                  <Bar yAxisId="right" dataKey="cpc" fill="#82ca9d" name="CPC (R$)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Gasto Total</p>
              <p className="text-2xl font-bold">{formatCurrency(metricas.total_gasto)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Impressões</p>
              <p className="text-2xl font-bold">{metricas.total_impressoes.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tempo Médio de Visualização</p>
              <p className="text-2xl font-bold">{Math.round(metricas.tempo_medio_visualizacao)}s</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold">{metricas.taxa_conversao.toFixed(2)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

