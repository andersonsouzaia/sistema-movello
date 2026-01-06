import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Download, Eye, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/formatters'
import { supabase } from '@/lib/supabase'
import type { AuditLog } from '@/types/database'

const actionOptions = [
  { value: 'user.create', label: 'Criar Usuário' },
  { value: 'user.role.update', label: 'Atualizar Role' },
  { value: 'user.role.remove', label: 'Remover Role' },
  { value: 'user.password.reset', label: 'Resetar Senha' },
  { value: 'empresa.approve', label: 'Aprovar Empresa' },
  { value: 'empresa.block', label: 'Bloquear Empresa' },
  { value: 'empresa.suspend', label: 'Suspender Empresa' },
  { value: 'motorista.approve', label: 'Aprovar Motorista' },
  { value: 'motorista.block', label: 'Bloquear Motorista' },
  { value: 'motorista.suspend', label: 'Suspender Motorista' },
]

const resourceOptions = [
  { value: 'users', label: 'Usuários' },
  { value: 'empresas', label: 'Empresas' },
  { value: 'motoristas', label: 'Motoristas' },
  { value: 'campanhas', label: 'Campanhas' },
  { value: 'pagamentos', label: 'Pagamentos' },
]

export default function AdminLogs() {
  const [actionFilter, setActionFilter] = useState<string>('')
  const [resourceFilter, setResourceFilter] = useState<string>('')
  const [userSearch, setUserSearch] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 50

  const { logs, loading, totalCount, refetch } = useAuditLogs({
    action: actionFilter && actionFilter !== '__all__' ? actionFilter : undefined,
    resourceType: resourceFilter && resourceFilter !== '__all__' ? resourceFilter : undefined,
    userId: userSearch || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: pageSize,
    page,
  })

  const handleExport = async () => {
    try {
      // Buscar todos os logs (sem paginação)
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Converter para CSV
      const headers = ['Data', 'Usuário', 'Ação', 'Recurso', 'Detalhes']
      const rows = (data || []).map((log) => [
        formatDateTime(log.created_at),
        log.user_id || 'N/A',
        log.action,
        log.resource_type,
        JSON.stringify(log.details || {}),
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n')

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } catch (error) {
      console.error('Erro ao exportar logs:', error)
    }
  }

  const columns: Column<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'Data',
      render: (row) => <div className="text-sm">{formatDateTime(row.created_at)}</div>,
    },
    {
      key: 'user_id',
      header: 'Usuário',
      render: (row) => (
        <div className="text-sm">
          {row.user_id ? (
            <span className="font-mono text-xs">{row.user_id.substring(0, 8)}...</span>
          ) : (
            <span className="text-muted-foreground">Sistema</span>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Ação',
      render: (row) => (
        <Badge variant="outline" className="text-xs">
          {row.action}
        </Badge>
      ),
    },
    {
      key: 'resource_type',
      header: 'Recurso',
      render: (row) => (
        <Badge variant="secondary" className="text-xs">
          {row.resource_type}
        </Badge>
      ),
    },
    {
      key: 'details',
      header: 'Detalhes',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedLog(row)}
          className="h-8"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <ProtectedRoute requiredUserType="admin">
      <RequirePermission permission="users.read">
        <DashboardLayout>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                  Logs de Auditoria
                </h1>
                <p className="text-lg text-muted-foreground">
                  Registro de todas as ações administrativas do sistema
                </p>
              </div>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </motion.div>

            {/* Filtros */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="card-premium p-4 rounded-lg border">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <Label>Ação</Label>
                    <Select value={actionFilter || '__all__'} onValueChange={(v) => setActionFilter(v === '__all__' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as ações" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todas as ações</SelectItem>
                        {actionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Recurso</Label>
                    <Select value={resourceFilter || '__all__'} onValueChange={(v) => setResourceFilter(v === '__all__' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os recursos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos os recursos</SelectItem>
                        {resourceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>ID do Usuário</Label>
                    <Input
                      placeholder="Buscar por ID..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Data Inicial</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Data Final</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tabela */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <DataTable
                data={logs}
                columns={columns}
                loading={loading}
                emptyMessage="Nenhum log encontrado"
                pageSize={pageSize}
              />
            </motion.div>

            {/* Dialog de Detalhes */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Detalhes do Log</DialogTitle>
                  <DialogDescription>Informações completas da ação registrada</DialogDescription>
                </DialogHeader>
                {selectedLog && (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold">Data</Label>
                        <p className="text-sm">{formatDateTime(selectedLog.created_at)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Ação</Label>
                        <p className="text-sm">{selectedLog.action}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Recurso</Label>
                        <p className="text-sm">{selectedLog.resource_type}</p>
                      </div>
                      {selectedLog.resource_id && (
                        <div>
                          <Label className="text-sm font-semibold">ID do Recurso</Label>
                          <p className="text-sm font-mono">{selectedLog.resource_id}</p>
                        </div>
                      )}
                      {selectedLog.user_id && (
                        <div>
                          <Label className="text-sm font-semibold">ID do Usuário</Label>
                          <p className="text-sm font-mono">{selectedLog.user_id}</p>
                        </div>
                      )}
                      {selectedLog.ip_address && (
                        <div>
                          <Label className="text-sm font-semibold">IP Address</Label>
                          <p className="text-sm">{selectedLog.ip_address}</p>
                        </div>
                      )}
                      {selectedLog.user_agent && (
                        <div>
                          <Label className="text-sm font-semibold">User Agent</Label>
                          <p className="text-sm text-xs break-all">{selectedLog.user_agent}</p>
                        </div>
                      )}
                      {selectedLog.details && (
                        <div>
                          <Label className="text-sm font-semibold">Detalhes</Label>
                          <pre className="mt-2 p-3 rounded-lg bg-muted text-xs overflow-auto">
                            {JSON.stringify(selectedLog.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </DashboardLayout>
      </RequirePermission>
    </ProtectedRoute>
  )
}

