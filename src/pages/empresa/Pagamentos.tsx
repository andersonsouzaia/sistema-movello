import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useEmpresaPagamentos, useCreatePagamento } from '@/hooks/useEmpresaPagamentos'
import { useEmpresaStats } from '@/hooks/useEmpresaStats'
import { empresaPagamentoService } from '@/services/empresaPagamentoService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Plus, Loader2, DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { exportToCSV, exportToExcel } from '@/utils/exportUtils'
import { useIsMobile } from '@/hooks/use-mobile'

const pagamentoSchema = z.object({
  valor: z.number().min(50, 'Valor mínimo é R$ 50,00'),
  metodo_pagamento: z.string().min(1, 'Selecione um método de pagamento'),
})

type PagamentoFormData = z.infer<typeof pagamentoSchema>

const statusConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  pendente: { label: 'Pendente', variant: 'secondary' },
  processando: { label: 'Processando', variant: 'default' },
  pago: { label: 'Pago', variant: 'default' },
  falhou: { label: 'Falhou', variant: 'destructive' },
  cancelado: { label: 'Cancelado', variant: 'secondary' },
  reembolsado: { label: 'Reembolsado', variant: 'destructive' },
}

export default function EmpresaPagamentos() {
  const isMobile = useIsMobile()
  const { empresa } = useAuth()
  const { stats } = useEmpresaStats()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { pagamentos, loading, error, refetch } = useEmpresaPagamentos({
    status: statusFilter || undefined,
  })
  const { createPagamento, loading: creating } = useCreatePagamento()
  const [addSaldoDialogOpen, setAddSaldoDialogOpen] = useState(false)

  const form = useForm<PagamentoFormData>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: {
      valor: 0,
      metodo_pagamento: '',
    },
  })

  const paymentMethods = empresaPagamentoService.getPaymentMethods()

  const handleCreatePagamento = async (data: PagamentoFormData) => {
    if (!empresa?.id) {
      toast.error('Empresa não encontrada')
      return
    }

    try {
      await createPagamento({
        valor: data.valor,
        metodo_pagamento: data.metodo_pagamento,
      }, empresa.id)
      setAddSaldoDialogOpen(false)
      form.reset()
      refetch()
      // Invalidar cache de stats
      if (stats) {
        window.location.reload()
      }
    } catch (error) {
      // Erro já é tratado no hook
    }
  }

  const handleExportCSV = () => {
    const dataToExport = pagamentos.map((p) => ({
      'Valor': formatCurrency(p.valor),
      'Método': p.metodo_pagamento || 'N/A',
      'Status': statusConfig[p.status]?.label || p.status,
      'Criado em': formatDateTime(p.criado_em),
      'Processado em': p.processado_em ? formatDateTime(p.processado_em) : 'N/A',
    }))
    exportToCSV(dataToExport, 'pagamentos')
  }

  const handleExportExcel = () => {
    const dataToExport = pagamentos.map((p) => ({
      'Valor': p.valor,
      'Método': p.metodo_pagamento || 'N/A',
      'Status': p.status,
      'Criado em': p.criado_em,
      'Processado em': p.processado_em || 'N/A',
    }))
    exportToExcel(dataToExport, 'pagamentos')
  }

  // Preparar dados para gráfico de extrato financeiro
  const extratoData = pagamentos
    .filter((p) => p.status === 'pago')
    .map((p) => ({
      mes: new Date(p.criado_em).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      valor: p.valor,
    }))
    .reduce((acc, curr) => {
      const existing = acc.find((item) => item.mes === curr.mes)
      if (existing) {
        existing.valor += curr.valor
      } else {
        acc.push(curr)
      }
      return acc
    }, [] as Array<{ mes: string; valor: number }>)
    .sort((a, b) => new Date(a.mes).getTime() - new Date(b.mes).getTime())

  const columns: Column<typeof pagamentos[0]>[] = [
    {
      key: 'valor',
      header: 'Valor',
      render: (row) => (
        <div className="font-medium">{formatCurrency(row.valor)}</div>
      ),
    },
    {
      key: 'metodo_pagamento',
      header: 'Método',
      render: (row) => (
        <div className="text-sm">{row.metodo_pagamento || 'N/A'}</div>
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
      key: 'criado_em',
      header: 'Criado em',
      render: (row) => (
        <div className="text-sm text-muted-foreground">
          {formatDateTime(row.criado_em)}
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
                Pagamentos
              </h1>
              <p className="text-lg text-muted-foreground">
                Gerencie seus pagamentos e saldo
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="gap-2"
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                Atualizar
              </Button>
              {pagamentos.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    className="gap-2"
                  >
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    className="gap-2"
                  >
                    Excel
                  </Button>
                </>
              )}
              <Dialog open={addSaldoDialogOpen} onOpenChange={setAddSaldoDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Saldo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Saldo</DialogTitle>
                    <DialogDescription>
                      Adicione créditos à sua conta para usar em campanhas
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(handleCreatePagamento)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor (R$) *</Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        min="50"
                        {...form.register('valor', { valueAsNumber: true })}
                        placeholder="100.00"
                        className="h-11"
                      />
                      {form.formState.errors.valor && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.valor.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Valor mínimo: R$ 50,00
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metodo_pagamento">Método de Pagamento *</Label>
                      <Select
                        value={form.watch('metodo_pagamento')}
                        onValueChange={(value) => form.setValue('metodo_pagamento', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um método" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.metodo_pagamento && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.metodo_pagamento.message}
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setAddSaldoDialogOpen(false)
                          form.reset()
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={creating}>
                        {creating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          'Adicionar Saldo'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Cards de Resumo */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="card-premium">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
                <DollarSign className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? formatCurrency(stats.saldo_disponivel) : 'Carregando...'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Disponível para campanhas
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    pagamentos
                      .filter((p) => p.status === 'pago')
                      .reduce((acc, p) => acc + p.valor, 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total de pagamentos aprovados
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
                <TrendingDown className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pagamentos.filter((p) => p.status === 'pendente').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando processamento
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="historico" className="space-y-6">
            <TabsList>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="extrato">Extrato Financeiro</TabsTrigger>
            </TabsList>

            {/* Tab: Histórico */}
            <TabsContent value="historico" className="space-y-6">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Histórico de Pagamentos</CardTitle>
                  <CardDescription>Lista de todos os seus pagamentos</CardDescription>
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
                  <DataTable
                    data={pagamentos}
                    columns={columns}
                    searchKey="metodo_pagamento"
                    searchPlaceholder="Buscar por método de pagamento..."
                    emptyMessage="Nenhum pagamento encontrado"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Extrato */}
            <TabsContent value="extrato" className="space-y-6">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Extrato Financeiro</CardTitle>
                  <CardDescription>Evolução dos seus pagamentos ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  {extratoData.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Nenhum dado disponível</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
                      <BarChart data={extratoData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="valor" fill="#8884d8" name="Valor Pago (R$)" />
                      </BarChart>
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
