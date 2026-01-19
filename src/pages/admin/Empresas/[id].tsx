import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { useAuth } from '@/contexts/AuthContext'
import { useEmpresa } from '@/hooks/useEmpresas'
import { adminService } from '@/services/adminService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, CheckCircle2, Ban, Loader2, Building2, Mail, Phone, Globe, Instagram } from 'lucide-react'
import { formatCNPJ, formatPhone, formatDate, formatCurrency } from '@/lib/utils/formatters'
import { toast } from 'sonner'
import { AdminBalanceAdjustmentDialog } from '@/components/admin/AdminBalanceAdjustmentDialog'
import { DollarSign, Wallet } from 'lucide-react'
import { useEmpresaStats } from '@/hooks/useEmpresaStats'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  aguardando_aprovacao: { label: 'Aguardando Aprovação', variant: 'secondary' },
  ativa: { label: 'Ativa', variant: 'default' },
  bloqueada: { label: 'Bloqueada', variant: 'destructive' },
  suspensa: { label: 'Suspensa', variant: 'destructive' },
}

export default function AdminEmpresaDetalhes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { empresa, loading, error, refetch: refetchEmpresa } = useEmpresa(id || '')
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const { stats, loading: statsLoading, refetch: refetchStats } = useEmpresaStats(id)

  const handleApprove = async () => {
    if (!user?.id || !id) {
      toast.error('Dados insuficientes para aprovar empresa')
      return
    }

    setActionLoading(true)
    try {
      const result = await adminService.approveEmpresa({
        userId: id,
        adminId: user.id,
      })

      if (result.success) {
        toast.success('Empresa aprovada com sucesso!')
        navigate('/admin/empresas')
      } else {
        toast.error(result.error || 'Erro ao aprovar empresa')
      }
    } catch (error) {
      console.error('Erro ao aprovar empresa:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao aprovar empresa')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBlock = async () => {
    if (!user?.id || !id || !motivo.trim()) {
      toast.error('Informe o motivo do bloqueio')
      return
    }

    setActionLoading(true)
    const result = await adminService.blockEmpresa({
      userId: id,
      adminId: user.id,
      motivo: motivo.trim(),
    })

    if (result.success) {
      setBlockDialogOpen(false)
      setMotivo('')
      navigate('/admin/empresas')
    }
    setActionLoading(false)
  }

  const handleSuspend = async () => {
    if (!user?.id || !id || !motivo.trim()) {
      toast.error('Informe o motivo da suspensão')
      return
    }

    setActionLoading(true)
    const result = await adminService.suspendEmpresa({
      userId: id,
      adminId: user.id,
      motivo: motivo.trim(),
    })

    if (result.success) {
      setSuspendDialogOpen(false)
      setMotivo('')
      navigate('/admin/empresas')
    }
    setActionLoading(false)
  }

  if (loading) {
    return (
      <ProtectedRoute requiredUserType="admin">
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error || !empresa) {
    return (
      <ProtectedRoute requiredUserType="admin">
        <DashboardLayout>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                Empresa não encontrada
              </h1>
              <Button onClick={() => navigate('/admin/empresas')}>
                Voltar para lista
              </Button>
            </motion.div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const statusInfo = statusConfig[empresa.status] || { label: empresa.status, variant: 'default' as const }

  return (
    <ProtectedRoute requiredUserType="admin">
      <RequirePermission permission="empresas.read">
        <DashboardLayout>
          <div className="space-y-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-4"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin/empresas')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                  {empresa.razao_social}
                </h1>
                <div className="flex items-center gap-2">
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  {empresa.nome_fantasia && (
                    <span className="text-muted-foreground">({empresa.nome_fantasia})</span>
                  )}
                </div>
              </div>
              <RequirePermission permission="empresas.approve">
                {empresa.status === 'aguardando_aprovacao' && (
                  <Button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Aprovar Empresa
                  </Button>
                )}
              </RequirePermission>
              <RequirePermission permission="empresas.manage_balance">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setAdjustmentDialogOpen(true)}
                >
                  <DollarSign className="h-4 w-4" />
                  Ajustar Saldo
                </Button>
              </RequirePermission>

              <RequirePermission permission="empresas.block">
                {empresa.status === 'ativa' && (
                  <>
                    <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="gap-2">
                          <Ban className="h-4 w-4" />
                          Bloquear
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bloquear Empresa</DialogTitle>
                          <DialogDescription>
                            Informe o motivo do bloqueio. Esta ação pode ser revertida posteriormente.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="motivo">Motivo do Bloqueio</Label>
                            <Textarea
                              id="motivo"
                              value={motivo}
                              onChange={(e) => setMotivo(e.target.value)}
                              placeholder="Descreva o motivo do bloqueio..."
                              rows={4}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button variant="destructive" onClick={handleBlock} disabled={actionLoading || !motivo.trim()}>
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Confirmar Bloqueio
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          Suspender
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Suspender Empresa</DialogTitle>
                          <DialogDescription>
                            Informe o motivo da suspensão. Esta ação pode ser revertida posteriormente.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="motivo-suspend">Motivo da Suspensão</Label>
                            <Textarea
                              id="motivo-suspend"
                              value={motivo}
                              onChange={(e) => setMotivo(e.target.value)}
                              placeholder="Descreva o motivo da suspensão..."
                              rows={4}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button variant="destructive" onClick={handleSuspend} disabled={actionLoading || !motivo.trim()}>
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Confirmar Suspensão
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </RequirePermission>

              <AdminBalanceAdjustmentDialog
                open={adjustmentDialogOpen}
                onOpenChange={setAdjustmentDialogOpen}
                empresaId={id || ''}
                empresaNome={empresa.razao_social}
                currentBalance={stats?.saldo_disponivel || 0}
                onSuccess={() => {
                  refetchStats()
                  refetchEmpresa()
                }}
              />
            </motion.div>

            {/* Informações Gerais */}
            <div className="grid gap-6 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle>Informações da Empresa</CardTitle>
                    <CardDescription>Dados cadastrais</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">Razão Social</Label>
                      <p className="font-medium">{empresa.razao_social}</p>
                    </div>
                    {empresa.nome_fantasia && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Nome Fantasia</Label>
                        <p className="font-medium">{empresa.nome_fantasia}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground text-sm">CNPJ</Label>
                      <p className="font-medium">{formatCNPJ(empresa.cnpj)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Status</Label>
                      <div className="mt-1">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </div>
                    </div>
                    {empresa.motivo_bloqueio && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Motivo do Bloqueio/Suspensão</Label>
                        <p className="text-sm text-destructive">{empresa.motivo_bloqueio}</p>
                      </div>
                    )}
                    {empresa.aprovado_em && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Aprovado em</Label>
                        <p className="font-medium">{formatDate(empresa.aprovado_em)}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground text-sm">Data de Cadastro</Label>
                      <p className="font-medium">{formatDate(empresa.created_at)}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle>Informações de Contato</CardTitle>
                    <CardDescription>Dados para comunicação</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <p className="font-medium">{empresa.user_email}</p>
                    </div>
                    {empresa.telefone_comercial && (
                      <div>
                        <Label className="text-muted-foreground text-sm flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Telefone Comercial
                        </Label>
                        <p className="font-medium">{formatPhone(empresa.telefone_comercial)}</p>
                      </div>
                    )}
                    {empresa.website && (
                      <div>
                        <Label className="text-muted-foreground text-sm flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Website
                        </Label>
                        <a
                          href={empresa.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          {empresa.website}
                        </a>
                      </div>
                    )}
                    {empresa.instagram && (
                      <div>
                        <Label className="text-muted-foreground text-sm flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          Instagram
                        </Label>
                        <a
                          href={`https://instagram.com/${empresa.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          {empresa.instagram}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Financeiro / Carteira */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card className="card-premium h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      Financeiro & Carteira
                    </CardTitle>
                    <CardDescription>Gestão de saldo e créditos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Saldo Disponível</Label>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className={cn(
                          "text-3xl font-bold font-display",
                          (stats?.saldo_disponivel || 0) < 0 ? "text-destructive" : "text-primary"
                        )}>
                          {formatCurrency(stats?.saldo_disponivel || 0)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Este é o saldo real que a empresa pode usar para novas campanhas.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Total Gasto</Label>
                        <p className="font-semibold text-lg">{formatCurrency(stats?.total_gasto || 0)}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Orçamento Total</Label>
                        <p className="font-semibold text-lg">{formatCurrency(stats?.orcamento_total || 0)}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <Button
                        className="w-full gap-2 h-11"
                        variant="secondary"
                        onClick={() => setAdjustmentDialogOpen(true)}
                      >
                        <DollarSign className="h-4 w-4" />
                        Realizar Ajuste de Saldo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </DashboardLayout>
      </RequirePermission>
    </ProtectedRoute >
  )
}

