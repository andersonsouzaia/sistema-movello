import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTickets } from '@/hooks/useTickets'
import { ticketService, GetTicketsFilters } from '@/services/ticketService'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Eye, CheckCircle, XCircle, User, Download, RefreshCw } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/formatters'
import { exportToCSV, exportToExcel, formatDataForExport } from '@/utils/exportUtils'
import type { TicketWithDetails, TicketStatus, TicketPrioridade } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const statusConfig: Record<TicketStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  aberto: { label: 'Aberto', variant: 'secondary' },
  em_andamento: { label: 'Em Andamento', variant: 'default' },
  resolvido: { label: 'Resolvido', variant: 'default' },
  fechado: { label: 'Fechado', variant: 'secondary' },
}

export default function AdminSuporte() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<GetTicketsFilters>({})
  const { tickets, loading, error, refetch } = useTickets(filters)

  const handleAssign = async (id: string) => {
    if (!user?.id) return
    const result = await ticketService.assignTicket(id, user.id)
    if (result.success) {
      refetch()
    }
  }

  const handleResolve = async (id: string) => {
    if (!user?.id) return
    const result = await ticketService.resolveTicket(id, user.id)
    if (result.success) {
      refetch()
    }
  }

  const handleClose = async (id: string) => {
    if (!user?.id) return
    const result = await ticketService.closeTicket(id, user.id)
    if (result.success) {
      refetch()
    }
  }

  const ticketsAbertos = tickets.filter((t) => t.status === 'aberto').length
  const ticketsEmAndamento = tickets.filter((t) => t.status === 'em_andamento').length
  const ticketsResolvidos = tickets.filter((t) => t.status === 'resolvido').length

  const columns: Column<TicketWithDetails>[] = [
    {
      key: 'titulo',
      header: 'Ticket',
      render: (row) => (
        <div>
          <div className="font-medium">#{row.id.slice(0, 8)} - {row.titulo}</div>
          <div className="text-xs text-muted-foreground">
            {row.empresa?.razao_social || row.motorista?.nome || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const status = statusConfig[row.status]
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
    {
      key: 'prioridade',
      header: 'Prioridade',
      render: (row) => {
        const colors: Record<TicketPrioridade, string> = {
          baixa: 'bg-green-500',
          media: 'bg-yellow-500',
          alta: 'bg-orange-500',
          urgente: 'bg-red-500',
        }
        return (
          <Badge style={{ backgroundColor: colors[row.prioridade] }} className="text-white">
            {row.prioridade.toUpperCase()}
          </Badge>
        )
      },
    },
    {
      key: 'atribuido_a',
      header: 'Atribuído',
      render: (row) => (row.atribuido ? row.atribuido.nome : 'Não atribuído'),
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
          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/suporte/${row.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === 'aberto' && (
            <Button variant="ghost" size="sm" onClick={() => handleAssign(row.id)}>
              <User className="h-4 w-4" />
            </Button>
          )}
          {row.status === 'em_andamento' && (
            <Button variant="ghost" size="sm" onClick={() => handleResolve(row.id)}>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </Button>
          )}
          {row.status === 'resolvido' && (
            <Button variant="ghost" size="sm" onClick={() => handleClose(row.id)}>
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <ProtectedRoute requiredUserType="admin">
      <RequirePermission permission="suporte.read">
        <DashboardLayout>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-4xl font-display font-bold text-foreground mb-2">Tickets de Suporte</h1>
                <p className="text-lg text-muted-foreground">Gerencie todos os tickets de suporte</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={loading}
                  title="Atualizar dados"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const formattedData = formatDataForExport(tickets, {
                      criado_em: (val) => formatDateTime(val),
                      resolvido_em: (val) => val ? formatDateTime(val) : 'N/A',
                    })
                    exportToCSV(formattedData, 'tickets', {
                      id: 'ID',
                      titulo: 'Título',
                      descricao: 'Descrição',
                      status: 'Status',
                      prioridade: 'Prioridade',
                      criado_em: 'Criado em',
                      resolvido_em: 'Resolvido em',
                    } as any)
                    toast.success('Tickets exportados com sucesso!')
                  }}
                  disabled={loading || tickets.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Abertos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ticketsAbertos}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ticketsEmAndamento}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Resolvidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ticketsResolvidos}</div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status || '__all__'}
                    onValueChange={(value) =>
                      setFilters({ ...filters, status: value === '__all__' ? undefined : value })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos</SelectItem>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="resolvido">Resolvido</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select
                    value={filters.prioridade || '__all__'}
                    onValueChange={(value) =>
                      setFilters({ ...filters, prioridade: value === '__all__' ? undefined : value })
                    }
                  >
                    <SelectTrigger id="prioridade">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="Título ou descrição..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {error && (
                <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">
                    <strong>Erro:</strong> {error}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => refetch()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar novamente
                  </Button>
                </div>
              )}
              {!loading && !error && tickets.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Nenhum ticket encontrado</p>
                  <Button variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              )}
              <DataTable
                data={tickets}
                columns={columns}
                loading={loading}
                searchKeys={['titulo', 'descricao']}
                searchPlaceholder="Buscar tickets..."
              />
            </motion.div>
          </div>
        </DashboardLayout>
      </RequirePermission>
    </ProtectedRoute>
  )
}
