import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { useAuth } from '@/contexts/AuthContext'
import { useMotorista } from '@/hooks/useMotoristas'
import { adminService } from '@/services/adminService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, CheckCircle2, Ban, Loader2, User, Mail, Phone, Car, CreditCard } from 'lucide-react'
import { formatCPF, formatPhone, formatPlaca, formatDate } from '@/lib/utils/formatters'
import { toast } from 'sonner'

const statusConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  aguardando_aprovacao: { label: 'Aguardando Aprovação', variant: 'secondary' },
  aprovado: { label: 'Aprovado', variant: 'default' },
  bloqueado: { label: 'Bloqueado', variant: 'destructive' },
  suspenso: { label: 'Suspenso', variant: 'destructive' },
}

export default function AdminMotoristaDetalhes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { motorista, loading, error } = useMotorista(id || '')
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const handleApprove = async () => {
    if (!user?.id || !id) return
    
    setActionLoading(true)
    const result = await adminService.approveMotorista({
      userId: id,
      adminId: user.id,
    })

    if (result.success) {
      navigate('/admin/motoristas')
    }
    setActionLoading(false)
  }

  const handleBlock = async () => {
    if (!user?.id || !id || !motivo.trim()) {
      toast.error('Informe o motivo do bloqueio')
      return
    }
    
    setActionLoading(true)
    const result = await adminService.blockMotorista({
      userId: id,
      adminId: user.id,
      motivo: motivo.trim(),
    })

    if (result.success) {
      setBlockDialogOpen(false)
      setMotivo('')
      navigate('/admin/motoristas')
    }
    setActionLoading(false)
  }

  const handleSuspend = async () => {
    if (!user?.id || !id || !motivo.trim()) {
      toast.error('Informe o motivo da suspensão')
      return
    }
    
    setActionLoading(true)
    const result = await adminService.suspendMotorista({
      userId: id,
      adminId: user.id,
      motivo: motivo.trim(),
    })

    if (result.success) {
      setSuspendDialogOpen(false)
      setMotivo('')
      navigate('/admin/motoristas')
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

  if (error || !motorista) {
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
                Motorista não encontrado
              </h1>
              <Button onClick={() => navigate('/admin/motoristas')}>
                Voltar para lista
              </Button>
            </motion.div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const statusInfo = statusConfig[motorista.status] || { label: motorista.status, variant: 'default' as const }

  return (
    <ProtectedRoute requiredUserType="admin">
      <RequirePermission permission="motoristas.read">
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
                onClick={() => navigate('/admin/motoristas')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                  {motorista.user_nome || 'Motorista'}
                </h1>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
              <RequirePermission permission="motoristas.approve">
                {motorista.status === 'aguardando_aprovacao' && (
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
                    Aprovar Motorista
                  </Button>
                )}
              </RequirePermission>
              <RequirePermission permission="motoristas.block">
                {motorista.status === 'aprovado' && (
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
                          <DialogTitle>Bloquear Motorista</DialogTitle>
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
                          <DialogTitle>Suspender Motorista</DialogTitle>
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
                    <CardTitle>Informações Pessoais</CardTitle>
                    <CardDescription>Dados do motorista</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nome Completo
                      </Label>
                      <p className="font-medium">{motorista.user_nome || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <p className="font-medium">{motorista.user_email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">CPF</Label>
                      <p className="font-medium">{formatCPF(motorista.cpf)}</p>
                    </div>
                    {motorista.rg && (
                      <div>
                        <Label className="text-muted-foreground text-sm">RG</Label>
                        <p className="font-medium">{motorista.rg}</p>
                      </div>
                    )}
                    {motorista.data_nascimento && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Data de Nascimento</Label>
                        <p className="font-medium">{formatDate(motorista.data_nascimento)}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </Label>
                      <p className="font-medium">{formatPhone(motorista.telefone)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Status</Label>
                      <div className="mt-1">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </div>
                    </div>
                    {motorista.motivo_bloqueio && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Motivo do Bloqueio/Suspensão</Label>
                        <p className="text-sm text-destructive">{motorista.motivo_bloqueio}</p>
                      </div>
                    )}
                    {motorista.aprovado_em && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Aprovado em</Label>
                        <p className="font-medium">{formatDate(motorista.aprovado_em)}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground text-sm">Data de Cadastro</Label>
                      <p className="font-medium">{formatDate(motorista.created_at)}</p>
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
                    <CardTitle>Informações do Veículo</CardTitle>
                    <CardDescription>Dados do veículo cadastrado</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground text-sm flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Veículo
                      </Label>
                      <p className="font-medium">{motorista.veiculo}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Placa</Label>
                      <p className="font-medium">{formatPlaca(motorista.placa)}</p>
                    </div>
                    {motorista.modelo_veiculo && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Modelo</Label>
                        <p className="font-medium">{motorista.modelo_veiculo}</p>
                      </div>
                    )}
                    {motorista.cor_veiculo && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Cor</Label>
                        <p className="font-medium">{motorista.cor_veiculo}</p>
                      </div>
                    )}
                    {motorista.ano_veiculo && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Ano</Label>
                        <p className="font-medium">{motorista.ano_veiculo}</p>
                      </div>
                    )}
                    {motorista.tablet_id && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Tablet ID</Label>
                        <p className="font-medium">{motorista.tablet_id}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {(motorista.banco || motorista.agencia || motorista.conta || motorista.pix) && (
                  <Card className="card-premium mt-6">
                    <CardHeader>
                      <CardTitle>Informações Bancárias</CardTitle>
                      <CardDescription>Dados para repasse</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {motorista.banco && (
                        <div>
                          <Label className="text-muted-foreground text-sm flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Banco
                          </Label>
                          <p className="font-medium">{motorista.banco}</p>
                        </div>
                      )}
                      {motorista.agencia && (
                        <div>
                          <Label className="text-muted-foreground text-sm">Agência</Label>
                          <p className="font-medium">{motorista.agencia}</p>
                        </div>
                      )}
                      {motorista.conta && (
                        <div>
                          <Label className="text-muted-foreground text-sm">Conta</Label>
                          <p className="font-medium">{motorista.conta}</p>
                        </div>
                      )}
                      {motorista.pix && (
                        <div>
                          <Label className="text-muted-foreground text-sm">PIX</Label>
                          <p className="font-medium">{motorista.pix}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          </div>
        </DashboardLayout>
      </RequirePermission>
    </ProtectedRoute>
  )
}

