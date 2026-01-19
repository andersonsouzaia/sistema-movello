import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable, Column } from '@/components/ui/DataTable'
import { FinancialSummary } from '@/components/admin/FinancialSummary'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePagamentos, useRepasses, useFinancialSummary, useAdminFinancialHistory } from '@/hooks/usePagamentos'
import { pagamentoService, GetPagamentosFilters, GetRepassesFilters } from '@/services/pagamentoService'
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle, RefreshCw, Eye, Download } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import { exportToCSV, exportToExcel, exportToPDF, formatDataForExport } from '@/utils/exportUtils'
import type { Pagamento, Repasse, PagamentoStatus, RepasseStatus } from '@/types/database'
import { cn } from '@/lib/utils'

const paymentStatusConfig: Record<PagamentoStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  pendente: { label: 'Pendente', variant: 'secondary' },
  processando: { label: 'Processando', variant: 'default' },
  pago: { label: 'Pago', variant: 'default' },
  falhou: { label: 'Falhou', variant: 'destructive' },
  cancelado: { label: 'Cancelado', variant: 'secondary' },
  reembolsado: { label: 'Reembolsado', variant: 'secondary' },
}

const repasseStatusConfig: Record<RepasseStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  pendente: { label: 'Pendente', variant: 'secondary' },
  processando: { label: 'Processando', variant: 'default' },
  pago: { label: 'Pago', variant: 'default' },
  falhou: { label: 'Falhou', variant: 'destructive' },
}

export default function AdminPagamentos() {
  const { user } = useAuth()
  const [paymentFilters, setPaymentFilters] = useState<GetPagamentosFilters>({})
  const [repasseFilters, setRepasseFilters] = useState<GetRepassesFilters>({})
  const { history: financialHistory, loading: loadingHistory, refetch: refetchHistory } = useAdminFinancialHistory(paymentFilters)
  const { repasses, loading: loadingRepasses, refetch: refetchRepasses } = useRepasses(repasseFilters)
  const { summary, loading: loadingSummary } = useFinancialSummary()

  const handleProcessPayment = async (id: string) => {
    if (!user?.id) return
    const result = await pagamentoService.processPayment(id, user.id)
    if (result.success) {
      refetchHistory()
    }
  }

  const handleProcessRepasse = async (id: string) => {
    if (!user?.id) return
    const result = await pagamentoService.processRepasse(id, user.id)
    if (result.success) {
      refetchRepasses()
    }
  }

  const handleRetryPayment = async (id: string) => {
    if (!user?.id) return
    const result = await pagamentoService.retryFailedPayment(id, user.id)
    if (result.success) {
      refetchHistory()
    }
  }

  const handleExportPayments = async (format: 'csv' | 'excel' | 'pdf') => {
    if (financialHistory.length === 0) {
      return
    }

    const headers = {
      id: 'ID',
      empresa_nome: 'Empresa',
      tipo: 'Tipo',
      descricao: 'Descrição',
      valor: 'Valor',
      status: 'Status',
      metodo_pagamento: 'Método de Pagamento',
      criado_em: 'Criado em',
    }

    const formattedData = formatDataForExport(financialHistory, {
      valor: (v) => formatCurrency(v),
      valor_liquido: (v) => formatCurrency(v),
      taxa: (v) => formatCurrency(v),
      status: (v) => paymentStatusConfig[v as PagamentoStatus]?.label || String(v),
      criado_em: (v) => formatDateTime(v),
      processado_em: (v) => v ? formatDateTime(v) : '-',
    })

    switch (format) {
      case 'csv':
        exportToCSV(formattedData, 'pagamentos', headers)
        break
      case 'excel':
        await exportToExcel(formattedData, 'pagamentos', 'Pagamentos', headers)
        break
      case 'pdf':
        await exportToPDF(formattedData, 'pagamentos', 'Relatório de Pagamentos', headers)
        break
    }
  }

  const handleExportRepasses = async (format: 'csv' | 'excel' | 'pdf') => {
    if (repasses.length === 0) {
      return
    }

    const headers: Record<keyof Repasse, string> = {
      id: 'ID',
      motorista_id: 'ID Motorista',
      pagamento_id: 'ID Pagamento',
      valor_liquido: 'Valor',
      status: 'Status',
      metodo_pagamento: 'Método de Pagamento',
      referencia_externa: 'Referência Externa',
      criado_em: 'Criado em',
      processado_em: 'Processado em',
    }

    const formattedData = formatDataForExport(repasses, {
      valor_liquido: (v) => formatCurrency(v),
      status: (v) => repasseStatusConfig[v as RepasseStatus]?.label || String(v),
      criado_em: (v) => formatDateTime(v),
      processado_em: (v) => v ? formatDateTime(v) : '-',
    })

    switch (format) {
      case 'csv':
        exportToCSV(formattedData, 'repasses', headers)
        break
      case 'excel':
        await exportToExcel(formattedData, 'repasses', 'Repasses', headers)
        break
      case 'pdf':
        await exportToPDF(formattedData, 'repasses', 'Relatório de Repasses', headers)
        break
    }
  }

  const paymentColumns: Column<any>[] = [
    {
      key: 'empresa_nome',
      header: 'Empresa',
      render: (row) => (
        <div className="font-medium text-sm">{row.empresa_nome || 'N/A'}</div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (row) => (
        <Badge variant={row.tipo === 'ajuste' ? 'outline' : 'secondary'}>
          {row.tipo === 'ajuste' ? 'Ajuste Manual' : 'Pagamento'}
        </Badge>
      ),
    },
    {
      key: 'descricao',
      header: 'Descrição',
      render: (row) => (
        <div className="text-sm text-muted-foreground truncate max-w-[200px]" title={row.descricao}>
          {row.descricao || '-'}
        </div>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      render: (row) => (
        <div className={cn("font-medium", row.valor < 0 ? "text-destructive" : "")}>
          {formatCurrency(row.valor)}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const config = paymentStatusConfig[row.status as PagamentoStatus] || { label: row.status, variant: 'default' }
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      key: 'criado_em',
      header: 'Data',
      render: (row) => formatDateTime(row.criado_em),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <div className="flex gap-2">
          {row.tipo === 'pagamento' && (
            <>
              {(row.status === 'pendente' || row.status === 'processando') && (
                <Button variant="ghost" size="sm" onClick={() => handleProcessPayment(row.id)}>
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
              {row.status === 'falhou' && (
                <Button variant="ghost" size="sm" onClick={() => handleRetryPayment(row.id)}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ]

  const repasseColumns: Column<Repasse>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (row) => `#${row.id.slice(0, 8)}`,
    },
    {
      key: 'valor_liquido',
      header: 'Valor',
      render: (row) => formatCurrency(row.valor_liquido),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const status = repasseStatusConfig[row.status]
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
    {
      key: 'criado_em',
      header: 'Criado em',
      render: (row) => formatDateTime(row.criado_em),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <div className="flex gap-2">
          {(row.status === 'pendente' || row.status === 'processando') && (
            <Button variant="ghost" size="sm" onClick={() => handleProcessRepasse(row.id)}>
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <ProtectedRoute requiredUserType="admin">
      <RequirePermission permission="pagamentos.read">
        <DashboardLayout>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-4xl font-display font-bold text-foreground mb-2">Pagamentos</h1>
              <p className="text-lg text-muted-foreground">Gerencie pagamentos e repasses</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <FinancialSummary summary={summary} loading={loadingSummary} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Tabs defaultValue="pagamentos">
                <TabsList>
                  <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
                  <TabsTrigger value="repasses">Repasses</TabsTrigger>
                </TabsList>
                <TabsContent value="pagamentos" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label htmlFor="payment-status">Status</Label>
                        <Select
                          value={paymentFilters.status || '__all__'}
                          onValueChange={(value) =>
                            setPaymentFilters({ ...paymentFilters, status: value === '__all__' ? undefined : value })
                          }
                        >
                          <SelectTrigger id="payment-status">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">Todos</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="processando">Processando</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="falhou">Falhou</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="payment-search">Buscar</Label>
                        <Input
                          id="payment-search"
                          placeholder="ID ou referência..."
                          value={paymentFilters.search || ''}
                          onChange={(e) => setPaymentFilters({ ...paymentFilters, search: e.target.value || undefined })}
                        />
                      </div>
                    </div>
                    <div className="ml-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleExportPayments('csv')}>
                            Exportar como CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportPayments('excel')}>
                            Exportar como Excel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportPayments('pdf')}>
                            Exportar como PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <DataTable
                    data={financialHistory}
                    columns={paymentColumns}
                    loading={loadingHistory}
                    searchKeys={['empresa_nome', 'descricao']}
                    searchPlaceholder="Buscar por empresa, descrição..."
                  />
                </TabsContent>
                <TabsContent value="repasses" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label htmlFor="repasse-status">Status</Label>
                        <Select
                          value={repasseFilters.status || '__all__'}
                          onValueChange={(value) =>
                            setRepasseFilters({ ...repasseFilters, status: value === '__all__' ? undefined : value })
                          }
                        >
                          <SelectTrigger id="repasse-status">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">Todos</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="processando">Processando</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="falhou">Falhou</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="repasse-search">Buscar</Label>
                        <Input
                          id="repasse-search"
                          placeholder="ID ou referência..."
                          value={repasseFilters.search || ''}
                          onChange={(e) => setRepasseFilters({ ...repasseFilters, search: e.target.value || undefined })}
                        />
                      </div>
                    </div>
                    <div className="ml-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleExportRepasses('csv')}>
                            Exportar como CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportRepasses('excel')}>
                            Exportar como Excel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportRepasses('pdf')}>
                            Exportar como PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <DataTable
                    data={repasses}
                    columns={repasseColumns}
                    loading={loadingRepasses}
                    searchKeys={['id', 'referencia_externa']}
                    searchPlaceholder="Buscar repasses..."
                  />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </DashboardLayout>
      </RequirePermission>
    </ProtectedRoute>
  )
}
