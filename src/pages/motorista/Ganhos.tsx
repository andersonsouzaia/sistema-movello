import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable, Column } from '@/components/ui/DataTable'
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, Calendar, Wallet } from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

// Mock data - será substituído por hooks reais quando o backend estiver pronto
interface Ganho {
  id: string
  valor: number
  descricao: string
  tipo: 'exibicao' | 'bonus' | 'recompensa'
  status: 'pendente' | 'processando' | 'pago' | 'falhou'
  data_exibicao: string
  criado_em: string
  processado_em: string | null
  campanha_id?: string
  campanha_titulo?: string
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  pendente: { label: 'Pendente', variant: 'secondary' },
  processando: { label: 'Processando', variant: 'default' },
  pago: { label: 'Pago', variant: 'default' },
  falhou: { label: 'Falhou', variant: 'destructive' },
}

const tipoConfig: Record<string, { label: string }> = {
  exibicao: { label: 'Exibição' },
  bonus: { label: 'Bônus' },
  recompensa: { label: 'Recompensa' },
}

export default function MotoristaGanhos() {
  const { motorista, profile } = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  // Mock data - será substituído por hook real
  const [ganhos] = useState<Ganho[]>([
    // Dados mockados para demonstração
  ])

  // Estatísticas mockadas
  const stats = {
    ganhosHoje: 0,
    ganhosMes: 0,
    totalPendente: 0,
    totalPago: 0,
  }

  // Dados para gráfico mockados
  const ganhosMensais = [
    { mes: 'Jan', valor: 0 },
    { mes: 'Fev', valor: 0 },
    { mes: 'Mar', valor: 0 },
    { mes: 'Abr', valor: 0 },
    { mes: 'Mai', valor: 0 },
    { mes: 'Jun', valor: 0 },
  ]

  const ganhosFiltrados = ganhos.filter((g) => 
    statusFilter === '' || g.status === statusFilter
  )

  const columns: Column<Ganho>[] = [
    {
      key: 'valor',
      header: 'Valor',
      render: (row) => (
        <div className="font-medium text-green-600">{formatCurrency(row.valor)}</div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (row) => {
        const config = tipoConfig[row.tipo] || { label: row.tipo }
        return <Badge variant="outline">{config.label}</Badge>
      },
    },
    {
      key: 'descricao',
      header: 'Descrição',
      render: (row) => (
        <div className="text-sm">
          {row.campanha_titulo ? `${row.descricao} - ${row.campanha_titulo}` : row.descricao}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const config = statusConfig[row.status] || { label: row.status, variant: 'secondary' as const }
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      key: 'data_exibicao',
      header: 'Data',
      render: (row) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.data_exibicao)}
        </div>
      ),
    },
    {
      key: 'processado_em',
      header: 'Processado em',
      render: (row) => (
        <div className="text-sm text-muted-foreground">
          {row.processado_em ? formatDateTime(row.processado_em) : '-'}
        </div>
      ),
    },
  ]

  return (
    <ProtectedRoute requiredUserType="motorista">
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
                Ganhos
              </h1>
              <p className="text-lg text-muted-foreground">
                Acompanhe seus ganhos e repasses
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setLoading(!loading)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background hover:bg-accent transition-colors"
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                Atualizar
              </button>
            </div>
          </motion.div>

          {/* Cards de Resumo */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="card-premium">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium">Ganhos de Hoje</CardTitle>
                <Calendar className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.ganhosHoje)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Hoje
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium">Ganhos do Mês</CardTitle>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.ganhosMes)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Este mês
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium">Pendente</CardTitle>
                <Wallet className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalPendente)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando processamento
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
                <DollarSign className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalPago)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total já pago
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="historico" className="space-y-6">
            <TabsList>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="graficos">Gráficos</TabsTrigger>
            </TabsList>

            {/* Tab: Histórico */}
            <TabsContent value="historico" className="space-y-6">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Histórico de Ganhos</CardTitle>
                  <CardDescription>Lista de todos os seus ganhos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value === '__all__' ? '' : value)}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos os status</SelectItem>
                        {Object.entries(statusConfig).map(([value, config]) => (
                          <SelectItem key={value} value={value}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {ganhosFiltrados.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhum ganho registrado ainda</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Seus ganhos aparecerão aqui quando você começar a exibir anúncios
                      </p>
                    </div>
                  ) : (
                    <DataTable
                      data={ganhosFiltrados}
                      columns={columns}
                      searchKey="descricao"
                      searchPlaceholder="Buscar ganhos..."
                      emptyMessage="Nenhum ganho encontrado"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Gráficos */}
            <TabsContent value="graficos" className="space-y-6">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Evolução dos Ganhos</CardTitle>
                  <CardDescription>Visualize seus ganhos ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  {ganhosMensais.every((g) => g.valor === 0) ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Nenhum dado disponível</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Os gráficos aparecerão quando houver dados de ganhos
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={ganhosMensais}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="valor" 
                          stroke="#8884d8" 
                          name="Ganhos (R$)" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

