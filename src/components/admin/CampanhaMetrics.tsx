import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { CampanhaMetrica } from '@/types/database'
import { formatCurrency } from '@/lib/utils/formatters'

interface CampanhaMetricsProps {
  metricas: CampanhaMetrica[]
  loading?: boolean
}

export function CampanhaMetrics({ metricas, loading }: CampanhaMetricsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métricas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalVisualizacoes = metricas.reduce((sum, m) => sum + m.visualizacoes, 0)
  const totalCliques = metricas.reduce((sum, m) => sum + m.cliques, 0)
  const totalConversoes = metricas.reduce((sum, m) => sum + m.conversoes, 0)
  const totalGasto = metricas.reduce((sum, m) => sum + Number(m.valor_gasto), 0)
  const taxaConversao = totalVisualizacoes > 0 ? ((totalConversoes / totalVisualizacoes) * 100).toFixed(2) : '0'
  const ctr = totalVisualizacoes > 0 ? ((totalCliques / totalVisualizacoes) * 100).toFixed(2) : '0'

  const chartData = metricas.map((m) => ({
    data: m.data,
    visualizacoes: m.visualizacoes,
    cliques: m.cliques,
    conversoes: m.conversoes,
    gasto: Number(m.valor_gasto),
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Visualizações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisualizacoes.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cliques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCliques.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">CTR: {ctr}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversoes.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Taxa: {taxaConversao}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalGasto)}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Performance ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="visualizacoes" stroke="#3B82F6" name="Visualizações" />
              <Line type="monotone" dataKey="cliques" stroke="#10B981" name="Cliques" />
              <Line type="monotone" dataKey="conversoes" stroke="#F59E0B" name="Conversões" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

