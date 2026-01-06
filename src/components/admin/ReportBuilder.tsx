import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Save, FileText } from 'lucide-react'
import { toast } from 'sonner'

export interface MetricOption {
  id: string
  label: string
  category: string
  type: 'number' | 'currency' | 'percentage' | 'date'
}

export interface ReportConfig {
  name: string
  metrics: string[]
  filters: Record<string, any>
  period: {
    type: '7d' | '30d' | '90d' | 'custom'
    start?: string
    end?: string
  }
  groupBy?: string
  visualization: 'line' | 'bar' | 'pie' | 'table'
  comparison?: {
    enabled: boolean
    period: 'previous' | 'custom'
    customStart?: string
    customEnd?: string
  }
}

interface ReportBuilderProps {
  onSave?: (config: ReportConfig) => void
  onGenerate?: (config: ReportConfig) => void
  initialConfig?: ReportConfig
}

const availableMetrics: MetricOption[] = [
  // Empresas
  { id: 'total_empresas', label: 'Total de Empresas', category: 'Empresas', type: 'number' },
  { id: 'empresas_ativas', label: 'Empresas Ativas', category: 'Empresas', type: 'number' },
  { id: 'empresas_pendentes', label: 'Empresas Pendentes', category: 'Empresas', type: 'number' },
  { id: 'empresas_bloqueadas', label: 'Empresas Bloqueadas', category: 'Empresas', type: 'number' },
  // Motoristas
  { id: 'total_motoristas', label: 'Total de Motoristas', category: 'Motoristas', type: 'number' },
  { id: 'motoristas_aprovados', label: 'Motoristas Aprovados', category: 'Motoristas', type: 'number' },
  { id: 'motoristas_pendentes', label: 'Motoristas Pendentes', category: 'Motoristas', type: 'number' },
  { id: 'motoristas_bloqueados', label: 'Motoristas Bloqueados', category: 'Motoristas', type: 'number' },
  // Campanhas
  { id: 'total_campanhas', label: 'Total de Campanhas', category: 'Campanhas', type: 'number' },
  { id: 'campanhas_ativas', label: 'Campanhas Ativas', category: 'Campanhas', type: 'number' },
  { id: 'campanhas_pendentes', label: 'Campanhas Pendentes', category: 'Campanhas', type: 'number' },
  { id: 'orcamento_total', label: 'Orçamento Total', category: 'Campanhas', type: 'currency' },
  { id: 'orcamento_utilizado', label: 'Orçamento Utilizado', category: 'Campanhas', type: 'currency' },
  // Tickets
  { id: 'total_tickets', label: 'Total de Tickets', category: 'Tickets', type: 'number' },
  { id: 'tickets_abertos', label: 'Tickets Abertos', category: 'Tickets', type: 'number' },
  { id: 'tickets_resolvidos', label: 'Tickets Resolvidos', category: 'Tickets', type: 'number' },
  { id: 'tempo_medio_resposta', label: 'Tempo Médio de Resposta', category: 'Tickets', type: 'number' },
  // Financeiro
  { id: 'total_receitas', label: 'Total de Receitas', category: 'Financeiro', type: 'currency' },
  { id: 'total_despesas', label: 'Total de Despesas', category: 'Financeiro', type: 'currency' },
  { id: 'saldo', label: 'Saldo', category: 'Financeiro', type: 'currency' },
  { id: 'pagamentos_pendentes', label: 'Pagamentos Pendentes', category: 'Financeiro', type: 'number' },
  { id: 'repasses_pendentes', label: 'Repasses Pendentes', category: 'Financeiro', type: 'number' },
]

const reportTemplates: Array<{ id: string; name: string; config: Partial<ReportConfig> }> = [
  {
    id: 'overview',
    name: 'Visão Geral',
    config: {
      metrics: ['total_empresas', 'total_motoristas', 'total_campanhas', 'total_tickets'],
      visualization: 'table',
      period: { type: '30d' },
    },
  },
  {
    id: 'financial',
    name: 'Relatório Financeiro',
    config: {
      metrics: ['total_receitas', 'total_despesas', 'saldo', 'pagamentos_pendentes', 'repasses_pendentes'],
      visualization: 'bar',
      period: { type: '30d' },
    },
  },
  {
    id: 'campaigns',
    name: 'Performance de Campanhas',
    config: {
      metrics: ['total_campanhas', 'campanhas_ativas', 'orcamento_total', 'orcamento_utilizado'],
      visualization: 'line',
      period: { type: '30d' },
      groupBy: 'status',
    },
  },
  {
    id: 'support',
    name: 'Análise de Suporte',
    config: {
      metrics: ['total_tickets', 'tickets_abertos', 'tickets_resolvidos', 'tempo_medio_resposta'],
      visualization: 'bar',
      period: { type: '30d' },
      groupBy: 'status',
    },
  },
]

export function ReportBuilder({ onSave, onGenerate, initialConfig }: ReportBuilderProps) {
  const [config, setConfig] = useState<ReportConfig>(
    initialConfig || {
      name: '',
      metrics: [],
      filters: {},
      period: { type: '30d' },
      visualization: 'table',
    }
  )

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showTemplates, setShowTemplates] = useState(false)

  const categories = Array.from(new Set(availableMetrics.map((m) => m.category)))
  const filteredMetrics = availableMetrics.filter(
    (m) => selectedCategory === 'all' || m.category === selectedCategory
  )

  const handleToggleMetric = (metricId: string) => {
    setConfig((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter((id) => id !== metricId)
        : [...prev.metrics, metricId],
    }))
  }

  const handleApplyTemplate = (template: typeof reportTemplates[0]) => {
    setConfig((prev) => ({
      ...prev,
      ...template.config,
      name: template.name,
    }))
    setShowTemplates(false)
    toast.success(`Template "${template.name}" aplicado!`)
  }

  const handleSave = () => {
    if (!config.name.trim()) {
      toast.error('Por favor, informe um nome para o relatório')
      return
    }
    if (config.metrics.length === 0) {
      toast.error('Selecione pelo menos uma métrica')
      return
    }
    onSave?.(config)
    toast.success('Relatório salvo!')
  }

  const handleGenerate = () => {
    if (config.metrics.length === 0) {
      toast.error('Selecione pelo menos uma métrica')
      return
    }
    onGenerate?.(config)
  }

  return (
    <div className="space-y-6">
      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Templates Pré-configurados
          </CardTitle>
          <CardDescription>Use um template como ponto de partida</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {reportTemplates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                className="h-auto flex-col py-3"
                onClick={() => handleApplyTemplate(template)}
              >
                <span className="text-sm font-medium">{template.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuração Básica */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Relatório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="report-name">Nome do Relatório</Label>
            <Input
              id="report-name"
              value={config.name}
              onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Relatório Mensal de Vendas"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period-type">Período</Label>
              <Select
                value={config.period.type}
                onValueChange={(value: any) =>
                  setConfig((prev) => ({
                    ...prev,
                    period: { ...prev.period, type: value },
                  }))
                }
              >
                <SelectTrigger id="period-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.period.type === 'custom' && (
              <>
                <div>
                  <Label htmlFor="start-date">Data Início</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={config.period.start || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        period: { ...prev.period, start: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Data Fim</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={config.period.end || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        period: { ...prev.period, end: e.target.value },
                      }))
                    }
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="visualization">Tipo de Visualização</Label>
              <Select
                value={config.visualization}
                onValueChange={(value: any) =>
                  setConfig((prev) => ({ ...prev, visualization: value }))
                }
              >
                <SelectTrigger id="visualization">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Tabela</SelectItem>
                  <SelectItem value="line">Gráfico de Linha</SelectItem>
                  <SelectItem value="bar">Gráfico de Barras</SelectItem>
                  <SelectItem value="pie">Gráfico de Pizza</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="group-by">Agrupar Por (Opcional)</Label>
              <Select
                value={config.groupBy || '__none__'}
                onValueChange={(value) =>
                  setConfig((prev) => ({ ...prev, groupBy: value === '__none__' ? undefined : value }))
                }
              >
                <SelectTrigger id="group-by">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="empresa">Empresa</SelectItem>
                  <SelectItem value="motorista">Motorista</SelectItem>
                  <SelectItem value="dia">Dia</SelectItem>
                  <SelectItem value="mes">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seleção de Métricas */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas Selecionadas</CardTitle>
          <CardDescription>
            {config.metrics.length} métrica(s) selecionada(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.metrics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.metrics.map((metricId) => {
                const metric = availableMetrics.find((m) => m.id === metricId)
                return metric ? (
                  <Badge key={metricId} variant="secondary" className="gap-1">
                    {metric.label}
                    <button
                      onClick={() => handleToggleMetric(metricId)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null
              })}
            </div>
          )}

          <div>
            <Label>Filtrar por Categoria</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {filteredMetrics.map((metric) => (
              <div key={metric.id} className="flex items-center space-x-2">
                <Checkbox
                  id={metric.id}
                  checked={config.metrics.includes(metric.id)}
                  onCheckedChange={() => handleToggleMetric(metric.id)}
                />
                <Label
                  htmlFor={metric.id}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {metric.label}
                </Label>
                <Badge variant="outline" className="text-xs">
                  {metric.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparação Período a Período */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação Período a Período</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-comparison"
              checked={config.comparison?.enabled || false}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({
                  ...prev,
                  comparison: {
                    ...prev.comparison,
                    enabled: checked as boolean,
                    period: prev.comparison?.period || 'previous',
                  },
                }))
              }
            />
            <Label htmlFor="enable-comparison" className="cursor-pointer">
              Habilitar comparação com período anterior
            </Label>
          </div>

          {config.comparison?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="comparison-period">Período de Comparação</Label>
                <Select
                  value={config.comparison?.period || 'previous'}
                  onValueChange={(value: any) =>
                    setConfig((prev) => ({
                      ...prev,
                      comparison: {
                        ...prev.comparison!,
                        period: value,
                      },
                    }))
                  }
                >
                  <SelectTrigger id="comparison-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="previous">Período Anterior</SelectItem>
                    <SelectItem value="custom">Período Customizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.comparison?.period === 'custom' && (
                <>
                  <div>
                    <Label htmlFor="comparison-start">Data Início Comparação</Label>
                    <Input
                      id="comparison-start"
                      type="date"
                      value={config.comparison?.customStart || ''}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          comparison: {
                            ...prev.comparison!,
                            customStart: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="comparison-end">Data Fim Comparação</Label>
                    <Input
                      id="comparison-end"
                      type="date"
                      value={config.comparison?.customEnd || ''}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          comparison: {
                            ...prev.comparison!,
                            customEnd: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-2">
        <Button onClick={handleSave} variant="outline">
          <Save className="h-4 w-4 mr-2" />
          Salvar Template
        </Button>
        <Button onClick={handleGenerate} className="flex-1">
          <FileText className="h-4 w-4 mr-2" />
          Gerar Relatório
        </Button>
      </div>
    </div>
  )
}

