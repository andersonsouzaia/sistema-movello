import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader2 } from 'lucide-react'
import type { CampanhaMetrica } from '@/types/database'
import { formatDate } from '@/lib/utils/formatters'
import { formatCurrency } from '@/lib/utils/formatters'

interface CampanhaMetricsChartProps {
  metrics: CampanhaMetrica[]
  loading?: boolean
  type?: 'line' | 'bar'
  title?: string
  description?: string
  showLegend?: boolean
}

export function CampanhaMetricsChart({
  metrics,
  loading = false,
  type = 'line',
  title,
  description,
  showLegend = true,
}: CampanhaMetricsChartProps) {
  const chartData = metrics.map((m) => ({
    data: formatDate(m.data),
    visualizacoes: m.visualizacoes,
    cliques: m.cliques,
    conversoes: m.conversoes,
    gasto: m.valor_gasto,
  }))

  const renderChart = () => {
    if (type === 'bar') {
      return (
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" />
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          <Bar dataKey="visualizacoes" fill="#8884d8" name="Visualizações" />
          <Bar dataKey="cliques" fill="#82ca9d" name="Cliques" />
          <Bar dataKey="conversoes" fill="#ffc658" name="Conversões" />
        </BarChart>
      )
    }

    return (
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="data" />
        <YAxis />
        <Tooltip />
        {showLegend && <Legend />}
        <Line type="monotone" dataKey="visualizacoes" stroke="#8884d8" name="Visualizações" />
        <Line type="monotone" dataKey="cliques" stroke="#82ca9d" name="Cliques" />
        <Line type="monotone" dataKey="conversoes" stroke="#ffc658" name="Conversões" />
      </LineChart>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">
            Nenhuma métrica disponível ainda
          </p>
        </CardContent>
      </Card>
    )
  }

  const content = (
    <ResponsiveContainer width="100%" height={300}>
      {renderChart()}
    </ResponsiveContainer>
  )

  if (title || description) {
    return (
      <Card>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    )
  }

  return content
}

