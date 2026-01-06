import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useEmpresaCampanhas } from '@/hooks/useEmpresaCampanhas'
import { useAtivarRascunho } from '@/hooks/useEmpresaRascunhos'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Eye, Edit, RefreshCw, Loader2, Download, Play, Search, LayoutGrid, Table as TableIcon, TrendingUp, DollarSign, Calendar, Filter, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import type { CampanhaStatus, CampanhaWithEmpresa } from '@/types/database'
import { exportToCSV, exportToExcel } from '@/utils/exportUtils'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { AlertCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { CampanhaCard } from '@/components/empresa/CampanhaCard'

const statusConfig: Record<CampanhaStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  em_analise: { label: 'Em Análise', variant: 'secondary' },
  aprovada: { label: 'Aprovada', variant: 'default' },
  reprovada: { label: 'Reprovada', variant: 'destructive' },
  ativa: { label: 'Ativa', variant: 'default' },
  pausada: { label: 'Pausada', variant: 'secondary' },
  finalizada: { label: 'Finalizada', variant: 'secondary' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
  rascunho: { label: 'Rascunho', variant: 'secondary' },
}

export default function EmpresaCampanhas() {
  const navigate = useNavigate()
  const { empresa } = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'active' | 'upcoming' | 'past'>('all')
  
  const { campanhas, loading, error, refetch } = useEmpresaCampanhas({
    status: statusFilter && statusFilter !== 'rascunho' ? statusFilter : undefined,
  })
  const { ativarRascunho, loading: ativando } = useAtivarRascunho()

  // Filtrar e processar campanhas
  const campanhasFiltradas = useMemo(() => {
    let filtered = [...campanhas]
    
    // Filtro de rascunho
    if (statusFilter === 'rascunho') {
      filtered = filtered.filter((c) => c.is_rascunho)
    }
    
    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((c) => 
        c.titulo.toLowerCase().includes(query) ||
        (c.descricao && c.descricao.toLowerCase().includes(query))
      )
    }
    
    // Filtro de data
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    if (dateFilter === 'active') {
      filtered = filtered.filter((c) => {
        const inicio = new Date(c.data_inicio)
        const fim = new Date(c.data_fim)
        inicio.setHours(0, 0, 0, 0)
        fim.setHours(0, 0, 0, 0)
        return inicio <= now && fim >= now && c.status === 'ativa'
      })
    } else if (dateFilter === 'upcoming') {
      filtered = filtered.filter((c) => {
        const inicio = new Date(c.data_inicio)
        inicio.setHours(0, 0, 0, 0)
        return inicio > now
      })
    } else if (dateFilter === 'past') {
      filtered = filtered.filter((c) => {
        const fim = new Date(c.data_fim)
        fim.setHours(0, 0, 0, 0)
        return fim < now
      })
    }
    
    return filtered
  }, [campanhas, statusFilter, searchQuery, dateFilter])

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = campanhas.length
    const ativas = campanhas.filter((c) => c.status === 'ativa').length
    const emAnalise = campanhas.filter((c) => c.status === 'em_analise').length
    const rascunhos = campanhas.filter((c) => c.is_rascunho).length
    const orcamentoTotal = campanhas.reduce((sum, c) => sum + c.orcamento, 0)
    const gastoTotal = campanhas.reduce((sum, c) => sum + (c.orcamento_utilizado || 0), 0)
    
    return {
      total,
      ativas,
      emAnalise,
      rascunhos,
      orcamentoTotal,
      gastoTotal,
      saldoDisponivel: orcamentoTotal - gastoTotal,
    }
  }, [campanhas])

  const handleAtivarRascunho = async (campanhaId: string) => {
    try {
      const resultado = await ativarRascunho(campanhaId)
      if (resultado.sucesso) {
        refetch()
      }
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  const handleExportCSV = () => {
    const dataToExport = campanhasFiltradas.map((c) => ({
      'Título': c.titulo,
      'Status': statusConfig[c.status]?.label || c.status,
      'Orçamento': formatCurrency(c.orcamento),
      'Gasto': formatCurrency(c.orcamento_utilizado || 0),
      'Data Início': formatDate(c.data_inicio),
      'Data Fim': formatDate(c.data_fim),
      'Criada em': formatDate(c.criado_em),
    }))
    exportToCSV(dataToExport, 'campanhas')
  }

  const handleExportExcel = () => {
    const dataToExport = campanhasFiltradas.map((c) => ({
      'Título': c.titulo,
      'Status': statusConfig[c.status]?.label || c.status,
      'Orçamento': c.orcamento,
      'Gasto': c.orcamento_utilizado || 0,
      'Data Início': c.data_inicio,
      'Data Fim': c.data_fim,
      'Criada em': c.criado_em,
    }))
    exportToExcel(dataToExport, 'campanhas')
  }

  const columns: Column<CampanhaWithEmpresa>[] = [
    {
      key: 'titulo',
      header: 'Nome da Campanha',
      render: (row) => (
        <div className="font-medium">{row.titulo}</div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const config = statusConfig[row.status]
        return (
          <div className="flex items-center gap-2">
            <Badge variant={config.variant}>{config.label}</Badge>
            {row.is_rascunho && (
              <Badge variant="outline" className="text-xs">Rascunho</Badge>
            )}
            {row.saldo_insuficiente && (
              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Saldo Insuficiente
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      key: 'orcamento',
      header: 'Orçamento',
      render: (row) => (
        <div className="font-medium">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(row.orcamento)}
        </div>
      ),
    },
    {
      key: 'orcamento_utilizado',
      header: 'Gasto',
      render: (row) => (
        <div className="font-medium">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(row.orcamento_utilizado || 0)}
        </div>
      ),
    },
    {
      key: 'criado_em',
      header: 'Criada em',
      render: (row) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.criado_em).toLocaleDateString('pt-BR')}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/empresa/campanhas/${row.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.is_rascunho ? (
            <>
              {!row.saldo_insuficiente && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAtivarRascunho(row.id)
                  }}
                  disabled={ativando}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Ativar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/empresa/campanhas/nova?rascunho=${row.id}`)
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Continuar Editando
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/empresa/campanhas/${row.id}`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
    value,
    label: config.label,
  }))

  const hasActiveFilters = statusFilter !== '' || searchQuery !== '' || dateFilter !== 'all'

  const clearFilters = () => {
    setStatusFilter('')
    setSearchQuery('')
    setDateFilter('all')
  }

  return (
    <ProtectedRoute requiredUserType="empresa">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                  Campanhas
                </h1>
                <p className="text-lg text-muted-foreground">
                  Gerencie suas campanhas de publicidade
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  className="gap-2"
                  disabled={loading}
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  Atualizar
                </Button>
                {campanhasFiltradas.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleExportCSV}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExportExcel}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Excel
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => navigate('/empresa/campanhas/nova')}
                  className="gap-2"
                  disabled={empresa?.status !== 'ativa'}
                >
                  <Plus className="h-4 w-4" />
                  Nova Campanha
                </Button>
              </div>
            </div>

            {/* Estatísticas Resumidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Campanhas
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.ativas} ativas • {stats.emAnalise} em análise
                  </p>
                </CardContent>
              </Card>

              <Card className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Orçamento Total
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.orcamentoTotal)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(stats.gastoTotal)} utilizado
                  </p>
                </CardContent>
              </Card>

              <Card className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Saldo Disponível
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "text-2xl font-bold",
                    stats.saldoDisponivel < 100 ? "text-yellow-500" : "text-primary"
                  )}>
                    {formatCurrency(stats.saldoDisponivel)}
                  </div>
                  <Progress 
                    value={stats.orcamentoTotal > 0 ? (stats.gastoTotal / stats.orcamentoTotal) * 100 : 0} 
                    className="h-1.5 mt-2"
                  />
                </CardContent>
              </Card>

              <Card className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Rascunhos
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.rascunhos}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aguardando ativação
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Filtros e Busca */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="card-premium p-4 space-y-4"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Busca */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar campanhas por título ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              {/* Filtro de Status */}
              <Select 
                value={statusFilter || '__all__'} 
                onValueChange={(value) => setStatusFilter(value === '__all__' ? '' : value)}
              >
                <SelectTrigger className="w-full lg:w-[180px] h-11">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os status</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro de Data */}
              <Select 
                value={dateFilter} 
                onValueChange={(v: 'all' | 'active' | 'upcoming' | 'past') => setDateFilter(v)}
              >
                <SelectTrigger className="w-full lg:w-[180px] h-11">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="active">Ativas agora</SelectItem>
                  <SelectItem value="upcoming">Futuras</SelectItem>
                  <SelectItem value="past">Finalizadas</SelectItem>
                </SelectContent>
              </Select>

              {/* Limpar Filtros */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="h-11 gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar
                </Button>
              )}

              {/* Toggle View Mode */}
              <div className="flex items-center gap-2 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="gap-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="gap-2"
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Contador de resultados */}
            {!loading && (
              <div className="text-sm text-muted-foreground">
                {campanhasFiltradas.length === campanhas.length ? (
                  <>Mostrando todas as {campanhasFiltradas.length} campanhas</>
                ) : (
                  <>
                    Mostrando {campanhasFiltradas.length} de {campanhas.length} campanhas
                    {hasActiveFilters && ' (filtradas)'}
                  </>
                )}
              </div>
            )}
          </motion.div>

          {/* Loading State */}
          {loading && campanhasFiltradas.length === 0 && (
            <TableSkeleton rows={5} columns={6} />
          )}

          {/* Error State */}
          {error && !loading && (
            <ErrorDisplay
              title="Erro ao carregar campanhas"
              message={error}
              onRetry={refetch}
            />
          )}

          {/* Conteúdo: Cards ou Tabela */}
          {!loading && !error && (
            <>
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campanhasFiltradas.length === 0 ? (
                    <div className="col-span-full">
                      <Card className="card-premium">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <p className="text-muted-foreground mb-4">
                            Nenhuma campanha encontrada. Crie sua primeira campanha!
                          </p>
                          <Button
                            onClick={() => navigate('/empresa/campanhas/nova')}
                            className="gap-2"
                            disabled={empresa?.status !== 'ativa'}
                          >
                            <Plus className="h-4 w-4" />
                            Nova Campanha
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    campanhasFiltradas.map((campanha) => (
                      <CampanhaCard
                        key={campanha.id}
                        campanha={campanha}
                        onView={(id) => navigate(`/empresa/campanhas/${id}`)}
                        onEdit={(id) => navigate(`/empresa/campanhas/${id}`)}
                        onActivate={async (id) => {
                          try {
                            const resultado = await ativarRascunho(id)
                            if (resultado.sucesso) {
                              refetch()
                            }
                          } catch (error) {
                            // Erro já tratado no hook
                          }
                        }}
                      />
                    ))
                  )}
                </div>
              ) : (
                <DataTable
                  data={campanhasFiltradas}
                  columns={columns}
                  searchKey=""
                  searchPlaceholder=""
                  filters={[]}
                  onRowClick={(row) => navigate(`/empresa/campanhas/${row.id}`)}
                  emptyMessage="Nenhuma campanha encontrada. Crie sua primeira campanha!"
                />
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

