import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader2 } from 'lucide-react'

interface ChartDataPoint {
  date?: string
  mes?: string
  dia?: string
  empresas?: number
  motoristas?: number
  aprovacoes?: number
  receitas?: number
  despesas?: number
  aberto?: number
  em_andamento?: number
  resolvido?: number
  fechado?: number
  [key: string]: any
}

interface StatsChartProps {
  data: ChartDataPoint[]
  loading?: boolean
  title?: string
  description?: string
  showLegend?: boolean
  dataKeys?: string[]
}

export function StatsChart({ 
  data, 
  loading, 
  title = 'Crescimento (30 dias)', 
  description,
  showLegend = true,
  dataKeys,
}: StatsChartProps) {
  // Se não há título, renderizar apenas o gráfico (para uso dentro de Card existente)
  const renderOnlyChart = !title && !description

  if (loading) {
    if (renderOnlyChart) {
      return (
        <div className="flex items-center justify-center h-full w-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }
    return (
      <Card className="card-premium">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartContent = (
    <div className="w-full h-full overflow-hidden" style={{ height: renderOnlyChart ? '100%' : '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: showLegend ? 60 : 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey={dataKeys ? (data[0]?.mes ? 'mes' : data[0]?.dia ? 'dia' : 'date') : 'date'}
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            stroke="currentColor"
          />
          <YAxis className="text-xs" tick={{ fill: 'currentColor' }} stroke="currentColor" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: any) => {
              if (typeof value === 'number' && value > 1000) {
                return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
              }
              return value
            }}
          />
          {showLegend && <Legend />}
          {dataKeys ? (
            dataKeys.map((key, idx) => {
              const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10B981', '#F59E0B', '#EF4444']
              const labels: Record<string, string> = {
                receitas: 'Receitas',
                despesas: 'Despesas',
                empresas: 'Empresas',
                motoristas: 'Motoristas',
                aprovacoes: 'Aprovações',
                aberto: 'Aberto',
                em_andamento: 'Em Andamento',
                resolvido: 'Resolvido',
                fechado: 'Fechado',
              }
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  name={labels[key] || key}
                  dot={{ r: 4 }}
                />
              )
            })
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="empresas"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Empresas"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="motoristas"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                name="Motoristas"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="aprovacoes"
                stroke="#10B981"
                strokeWidth={2}
                name="Aprovações"
                dot={{ r: 4 }}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )

  if (renderOnlyChart) {
    return chartContent
  }

  return (
    <Card className="card-premium">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="overflow-hidden" style={{ height: '300px' }}>
        {chartContent}
      </CardContent>
    </Card>
  )
}
