import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAdminStats } from '@/hooks/useAdminStats'
import { useAdvancedStats } from '@/hooks/useAdvancedStats'
import { useCampanhas } from '@/hooks/useCampanhas'
import { useTickets } from '@/hooks/useTickets'
import { useFinancialSummary } from '@/hooks/usePagamentos'
import { ReportBuilder, type ReportConfig } from '@/components/admin/ReportBuilder'
import { ExportScheduler } from '@/components/admin/ExportScheduler'
import { Download, Settings, FileText, BarChart3 } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatters'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/exportUtils'
import { toast } from 'sonner'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function AdminRelatorios() {
  const { stats, loading } = useAdminStats()
  const { stats: advancedStats } = useAdvancedStats()
  const { campanhas } = useCampanhas({})
  const { tickets } = useTickets({})
  const { summary: financialSummary } = useFinancialSummary()

  const [currentReport, setCurrentReport] = useState<ReportConfig | null>(null)
  const [savedReports, setSavedReports] = useState<ReportConfig[]>([])

  // Preparar dados para visualização baseada na configuração do relatório
  const reportData = useMemo(() => {
    if (!currentReport || currentReport.metrics.length === 0) return null

    const data: Record<string, any> = {}

    // Mapear métricas para valores reais
    const metricValues: Record<string, number> = {
      total_empresas: stats?.total_empresas || 0,
      empresas_ativas: stats?.empresas_ativas || 0,
      empresas_pendentes: stats?.empresas_pendentes || 0,
      empresas_bloqueadas: stats?.empresas_bloqueadas || 0,
      total_motoristas: stats?.total_motoristas || 0,
      motoristas_aprovados: stats?.motoristas_aprovados || 0,
      motoristas_pendentes: stats?.motoristas_pendentes || 0,
      motoristas_bloqueados: stats?.motoristas_bloqueados || 0,
      total_campanhas: campanhas.length,
      campanhas_ativas: campanhas.filter((c) => c.status === 'ativa').length,
      campanhas_pendentes: campanhas.filter((c) => c.status === 'em_analise').length,
      orcamento_total: campanhas.reduce((sum, c) => sum + c.orcamento, 0),
      orcamento_utilizado: campanhas.reduce((sum, c) => sum + c.orcamento_utilizado, 0),
      total_tickets: tickets.length,
      tickets_abertos: tickets.filter((t) => t.status === 'aberto').length,
      tickets_resolvidos: tickets.filter((t) => t.status === 'resolvido').length,
      tempo_medio_resposta: 0, // TODO: calcular do banco
      total_receitas: financialSummary?.total_receitas || 0,
      total_despesas: financialSummary?.total_despesas || 0,
      saldo: financialSummary?.saldo || 0,
      pagamentos_pendentes: financialSummary?.pagamentos_pendentes || 0,
      repasses_pendentes: financialSummary?.repasses_pendentes || 0,
    }

    // Preparar dados para gráficos
    if (currentReport.groupBy === 'status') {
      if (currentReport.metrics.some((m) => m.includes('campanha'))) {
        const grouped = campanhas.reduce((acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        return Object.entries(grouped).map(([name, value]) => ({ name, value }))
      } else if (currentReport.metrics.some((m) => m.includes('ticket'))) {
        const grouped = tickets.reduce((acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        return Object.entries(grouped).map(([name, value]) => ({ name, value }))
      }
    }

    // Dados simples para tabela ou gráfico sem agrupamento
    return currentReport.metrics.map((metricId) => ({
      metric: metricId,
      value: metricValues[metricId] || 0,
    }))
  }, [currentReport, stats, campanhas, tickets, financialSummary])

  const handleSaveReport = (config: ReportConfig) => {
    setSavedReports((prev) => [...prev, config])
    toast.success('Relatório salvo!')
  }

  const handleGenerateReport = (config: ReportConfig) => {
    setCurrentReport(config)
    toast.success('Relatório gerado!')
  }

  const handleExport = async (formato: 'pdf' | 'excel' | 'csv') => {
    if (!currentReport || !reportData) {
      toast.error('Gere um relatório primeiro')
      return
    }

    try {
      const exportData = reportData.map((item: any) => ({
        Métrica: item.metric || item.name,
        Valor: item.value,
      }))

      if (formato === 'csv') {
        exportToCSV(exportData, currentReport.name || 'relatorio')
        toast.success('Relatório exportado em CSV!')
      } else if (formato === 'excel') {
        await exportToExcel(exportData, currentReport.name || 'relatorio', 'Relatório')
        toast.success('Relatório exportado em Excel!')
      } else if (formato === 'pdf') {
        await exportToPDF(exportData, currentReport.name || 'relatorio', currentReport.name || 'Relatório')
        toast.success('Relatório exportado em PDF!')
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error)
      toast.error('Erro ao exportar relatório')
    }
  }

  const renderVisualization = () => {
    if (!currentReport || !reportData) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Configure e gere um relatório para visualizar
        </div>
      )
    }

    if (currentReport.visualization === 'table') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Métrica</th>
                <th className="text-right p-2">Valor</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item: any, idx: number) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{item.metric || item.name}</td>
                  <td className="text-right p-2 font-medium">
                    {typeof item.value === 'number' && item.value > 1000
                      ? formatCurrency(item.value)
                      : item.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (currentReport.visualization === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={reportData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {reportData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    if (currentReport.visualization === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    if (currentReport.visualization === 'line') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    return null
  }

  return (
    <ProtectedRoute requiredUserType="admin">
      <RequirePermission permission="configuracoes.read">
        <DashboardLayout>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-4xl font-display font-bold text-foreground mb-2">Relatórios</h1>
                <p className="text-lg text-muted-foreground">Crie relatórios customizados e visualize analytics</p>
              </div>
              {currentReport && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar como CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar como Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar como PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </motion.div>

            <Tabs defaultValue="builder" className="space-y-6">
              <TabsList>
                <TabsTrigger value="builder">
                  <Settings className="h-4 w-4 mr-2" />
                  Builder
                </TabsTrigger>
                <TabsTrigger value="view">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Visualizar
                </TabsTrigger>
                <TabsTrigger value="saved">
                  <FileText className="h-4 w-4 mr-2" />
                  Salvos ({savedReports.length})
                </TabsTrigger>
                <TabsTrigger value="schedule">
                  <Download className="h-4 w-4 mr-2" />
                  Agendamentos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="builder">
                <ReportBuilder onSave={handleSaveReport} onGenerate={handleGenerateReport} />
              </TabsContent>

              <TabsContent value="view">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {currentReport?.name || 'Nenhum relatório gerado'}
                    </CardTitle>
                    <CardDescription>
                      {currentReport?.period.type === 'custom'
                        ? `${currentReport.period.start} a ${currentReport.period.end}`
                        : `Período: ${currentReport?.period.type || 'N/A'}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      renderVisualization()
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="saved">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {savedReports.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      Nenhum relatório salvo ainda
                    </div>
                  ) : (
                    savedReports.map((report, idx) => (
                      <Card key={idx} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardHeader>
                          <CardTitle className="text-lg">{report.name}</CardTitle>
                          <CardDescription>
                            {report.metrics.length} métrica(s) • {report.visualization}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setCurrentReport(report)
                              handleGenerateReport(report)
                            }}
                          >
                            Usar este relatório
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="schedule">
                <ExportScheduler
                  dataSources={[
                    { value: 'campanhas', label: 'Campanhas' },
                    { value: 'tickets', label: 'Tickets' },
                    { value: 'empresas', label: 'Empresas' },
                    { value: 'motoristas', label: 'Motoristas' },
                    { value: 'pagamentos', label: 'Pagamentos' },
                    { value: 'repasses', label: 'Repasses' },
                    { value: 'relatorios', label: 'Relatórios Customizados' },
                  ]}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DashboardLayout>
      </RequirePermission>
    </ProtectedRoute>
  )
}
