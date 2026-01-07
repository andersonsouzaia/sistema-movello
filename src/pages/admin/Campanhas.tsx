import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { DataTable, Column } from '@/components/ui/DataTable'
import { CampanhaFilters } from '@/components/admin/CampanhaFilters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useCampanhas } from '@/hooks/useCampanhas'
import { campanhaService, GetCampanhasFilters } from '@/services/campanhaService'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Eye, Check, X, Pause, Play, Download, RefreshCw } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils/formatters'
import { exportToCSV, exportToExcel, formatDataForExport } from '@/utils/exportUtils'
import type { CampanhaWithEmpresa, CampanhaStatus } from '@/types/database'
import { toast } from 'sonner'

const statusConfig: Record<CampanhaStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  rascunho: { label: 'Rascunho', variant: 'secondary' },
  em_analise: { label: 'Em Análise', variant: 'secondary' },
  aprovada: { label: 'Aprovada', variant: 'default' },
  reprovada: { label: 'Reprovada', variant: 'destructive' },
  ativa: { label: 'Ativa', variant: 'default' },
  pausada: { label: 'Pausada', variant: 'secondary' },
  finalizada: { label: 'Finalizada', variant: 'secondary' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
}

export default function AdminCampanhas() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<GetCampanhasFilters>({})
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedCampanha, setSelectedCampanha] = useState<string | null>(null)
  const [rejectMotivo, setRejectMotivo] = useState('')
  const [confirmApprove, setConfirmApprove] = useState<string | null>(null)
  const [confirmPause, setConfirmPause] = useState<string | null>(null)
  const [confirmActivate, setConfirmActivate] = useState<string | null>(null)

  const { campanhas, loading, error, refetch } = useCampanhas(filters)

  const handleApprove = async (id: string) => {
    if (!user?.id) return
    setConfirmApprove(id)
  }

  const confirmApproveAction = async () => {
    if (!user?.id || !confirmApprove) return
    const result = await campanhaService.approveCampanha(confirmApprove, user.id)
    if (result.success) {
      refetch()
      setConfirmApprove(null)
    }
  }

  const handleReject = async () => {
    if (!user?.id || !selectedCampanha) return
    if (!rejectMotivo.trim()) {
      toast.error('Por favor, informe o motivo da reprovação')
      return
    }
    const result = await campanhaService.rejectCampanha(selectedCampanha, user.id, rejectMotivo)
    if (result.success) {
      setRejectDialogOpen(false)
      setRejectMotivo('')
      setSelectedCampanha(null)
      refetch()
    }
  }

  const handlePause = async (id: string) => {
    if (!user?.id) return
    setConfirmPause(id)
  }

  const confirmPauseAction = async () => {
    if (!user?.id || !confirmPause) return
    const result = await campanhaService.pauseCampanha(confirmPause, user.id)
    if (result.success) {
      refetch()
      setConfirmPause(null)
    }
  }

  const handleActivate = async (id: string) => {
    if (!user?.id) return
    setConfirmActivate(id)
  }

  const confirmActivateAction = async () => {
    if (!user?.id || !confirmActivate) return
    const result = await campanhaService.activateCampanha(confirmActivate, user.id)
    if (result.success) {
      refetch()
      setConfirmActivate(null)
    }
  }

  const columns: Column<CampanhaWithEmpresa>[] = [
    {
      key: 'titulo',
      header: 'Título',
      render: (row) => (
        <div>
          <div className="font-medium">{row.titulo}</div>
          <div className="text-xs text-muted-foreground">{row.empresa?.razao_social || 'N/A'}</div>
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
      key: 'orcamento',
      header: 'Orçamento',
      render: (row) => formatCurrency(row.orcamento),
    },
    {
      key: 'data_inicio',
      header: 'Período',
      render: (row) => `${formatDate(row.data_inicio)} - ${formatDate(row.data_fim)}`,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/campanhas/${row.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === 'em_analise' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => handleApprove(row.id)}>
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCampanha(row.id)
                  setRejectDialogOpen(true)
                }}
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </>
          )}
          {row.status === 'aprovada' && (
            <Button variant="ghost" size="sm" onClick={() => handleActivate(row.id)}>
              <Play className="h-4 w-4" />
            </Button>
          )}
          {(row.status === 'ativa' || row.status === 'aprovada') && (
            <Button variant="ghost" size="sm" onClick={() => handlePause(row.id)}>
              <Pause className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <ProtectedRoute requiredUserType="admin">
      <RequirePermission permission="campanhas.read">
        <DashboardLayout>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-4xl font-display font-bold text-foreground mb-2">Campanhas</h1>
                <p className="text-lg text-muted-foreground">Gerencie todas as campanhas do sistema</p>
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
                    const formattedData = formatDataForExport(campanhas, {
                      criado_em: (val) => formatDate(val),
                      data_inicio: (val) => formatDate(val),
                      data_fim: (val) => formatDate(val),
                      orcamento: (val) => formatCurrency(val),
                      orcamento_utilizado: (val) => formatCurrency(val),
                    })
                    exportToCSV(formattedData, 'campanhas', {
                      id: 'ID',
                      titulo: 'Título',
                      descricao: 'Descrição',
                      status: 'Status',
                      orcamento: 'Orçamento',
                      orcamento_utilizado: 'Orçamento Utilizado',
                      data_inicio: 'Data Início',
                      data_fim: 'Data Fim',
                      criado_em: 'Criado em',
                    } as any)
                    toast.success('Campanhas exportadas com sucesso!')
                  }}
                  disabled={loading || campanhas.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const formattedData = formatDataForExport(campanhas, {
                      criado_em: (val) => formatDate(val),
                      data_inicio: (val) => formatDate(val),
                      data_fim: (val) => formatDate(val),
                      orcamento: (val) => formatCurrency(val),
                      orcamento_utilizado: (val) => formatCurrency(val),
                    })
                    await exportToExcel(formattedData, 'campanhas', 'Campanhas', {
                      id: 'ID',
                      titulo: 'Título',
                      descricao: 'Descrição',
                      status: 'Status',
                      orcamento: 'Orçamento',
                      orcamento_utilizado: 'Orçamento Utilizado',
                      data_inicio: 'Data Início',
                      data_fim: 'Data Fim',
                      criado_em: 'Criado em',
                    } as any)
                    toast.success('Campanhas exportadas com sucesso!')
                  }}
                  disabled={loading || campanhas.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <CampanhaFilters
                filters={filters}
                onFiltersChange={setFilters}
                onClear={() => setFilters({})}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
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
              {!loading && !error && campanhas.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Nenhuma campanha encontrada</p>
                  <Button variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              )}
              <DataTable
                data={campanhas}
                columns={columns}
                loading={loading}
                searchKeys={['titulo', 'descricao']}
                searchPlaceholder="Buscar campanhas..."
              />
            </motion.div>
          </div>

          <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reprovar Campanha</DialogTitle>
                <DialogDescription>Informe o motivo da reprovação</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="motivo">Motivo</Label>
                  <Textarea
                    id="motivo"
                    value={rejectMotivo}
                    onChange={(e) => setRejectMotivo(e.target.value)}
                    placeholder="Descreva o motivo da reprovação..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  Reprovar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Diálogos de Confirmação */}
          <ConfirmDialog
            open={confirmApprove !== null}
            onOpenChange={(open) => !open && setConfirmApprove(null)}
            onConfirm={confirmApproveAction}
            title="Aprovar Campanha"
            description="Tem certeza que deseja aprovar esta campanha? Ela ficará disponível para ativação."
            confirmText="Aprovar"
            cancelText="Cancelar"
          />

          <ConfirmDialog
            open={confirmPause !== null}
            onOpenChange={(open) => !open && setConfirmPause(null)}
            onConfirm={confirmPauseAction}
            title="Pausar Campanha"
            description="Tem certeza que deseja pausar esta campanha? Ela será interrompida temporariamente."
            confirmText="Pausar"
            cancelText="Cancelar"
          />

          <ConfirmDialog
            open={confirmActivate !== null}
            onOpenChange={(open) => !open && setConfirmActivate(null)}
            onConfirm={confirmActivateAction}
            title="Ativar Campanha"
            description="Tem certeza que deseja ativar esta campanha? Ela começará a ser exibida imediatamente."
            confirmText="Ativar"
            cancelText="Cancelar"
          />
        </DashboardLayout>
      </RequirePermission>
    </ProtectedRoute>
  )
}
