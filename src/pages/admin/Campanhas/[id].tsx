import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CampanhaMetrics } from '@/components/admin/CampanhaMetrics'
import { useCampanha } from '@/hooks/useCampanhas'
import { campanhaService } from '@/services/campanhaService'
import { midiaService } from '@/services/midiaService'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Check, X, Pause, Play, Upload, Image as ImageIcon, Video } from 'lucide-react'
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import type { CampanhaStatus, Midia, MidiaStatus } from '@/types/database'
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

const midiaStatusConfig: Record<MidiaStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  em_analise: { label: 'Em Análise', variant: 'secondary' },
  aprovada: { label: 'Aprovada', variant: 'default' },
  reprovada: { label: 'Reprovada', variant: 'destructive' },
}

export default function AdminCampanhaDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { campanha, loading } = useCampanha(id || '')
  const [midias, setMidias] = useState<Midia[]>([])
  const [loadingMidias, setLoadingMidias] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectMidiaDialogOpen, setRejectMidiaDialogOpen] = useState(false)
  const [selectedMidia, setSelectedMidia] = useState<string | null>(null)
  const [rejectMotivo, setRejectMotivo] = useState('')
  const [metricas, setMetricas] = useState<any[]>([])

  useEffect(() => {
    if (id) {
      loadMidias()
      loadMetricas()
    }
  }, [id])

  const loadMidias = async () => {
    if (!id) return
    setLoadingMidias(true)
    try {
      const data = await midiaService.getMidias(id)
      setMidias(data)
    } catch (error) {
      console.error('Erro ao carregar mídias:', error)
    } finally {
      setLoadingMidias(false)
    }
  }

  const loadMetricas = async () => {
    if (!id || !campanha) return
    try {
      const inicio = new Date(campanha.data_inicio)
      const fim = new Date(campanha.data_fim)
      const data = await campanhaService.getCampanhaMetricas(id, {
        inicio: inicio.toISOString().split('T')[0],
        fim: fim.toISOString().split('T')[0],
      })
      setMetricas(data)
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    }
  }

  const handleApprove = async () => {
    if (!user?.id || !id) return
    const result = await campanhaService.approveCampanha(id, user.id)
    if (result.success) {
      navigate('/admin/campanhas')
    }
  }

  const handleReject = async () => {
    if (!user?.id || !id) return
    if (!rejectMotivo.trim()) {
      toast.error('Por favor, informe o motivo da reprovação')
      return
    }
    const result = await campanhaService.rejectCampanha(id, user.id, rejectMotivo)
    if (result.success) {
      setRejectDialogOpen(false)
      setRejectMotivo('')
      navigate('/admin/campanhas')
    }
  }

  const handlePause = async () => {
    if (!user?.id || !id) return
    const result = await campanhaService.pauseCampanha(id, user.id)
    if (result.success) {
      window.location.reload()
    }
  }

  const handleActivate = async () => {
    if (!user?.id || !id) return
    const result = await campanhaService.activateCampanha(id, user.id)
    if (result.success) {
      window.location.reload()
    }
  }

  const handleApproveMidia = async (midiaId: string) => {
    if (!user?.id) return
    const result = await midiaService.approveMidia(midiaId, user.id)
    if (result.success) {
      loadMidias()
    }
  }

  const handleRejectMidia = async () => {
    if (!user?.id || !selectedMidia) return
    if (!rejectMotivo.trim()) {
      toast.error('Por favor, informe o motivo da reprovação')
      return
    }
    const result = await midiaService.rejectMidia(selectedMidia, user.id, rejectMotivo)
    if (result.success) {
      setRejectMidiaDialogOpen(false)
      setRejectMotivo('')
      setSelectedMidia(null)
      loadMidias()
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredUserType="admin">
        <RequirePermission permission="campanhas.read">
          <DashboardLayout>
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          </DashboardLayout>
        </RequirePermission>
      </ProtectedRoute>
    )
  }

  if (!campanha) {
    return (
      <ProtectedRoute requiredUserType="admin">
        <RequirePermission permission="campanhas.read">
          <DashboardLayout>
            <div className="text-center py-12">
              <p className="text-muted-foreground">Campanha não encontrada</p>
              <Button onClick={() => navigate('/admin/campanhas')} className="mt-4">
                Voltar para Campanhas
              </Button>
            </div>
          </DashboardLayout>
        </RequirePermission>
      </ProtectedRoute>
    )
  }

  const status = statusConfig[campanha.status]

  return (
    <ProtectedRoute requiredUserType="admin">
      <RequirePermission permission="campanhas.read">
        <DashboardLayout>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/campanhas')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <h1 className="text-4xl font-display font-bold text-foreground mb-2">{campanha.titulo}</h1>
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <span className="text-muted-foreground">
                      Criada em {formatDateTime(campanha.criado_em)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {campanha.status === 'em_analise' && (
                    <>
                      <Button variant="default" onClick={handleApprove}>
                        <Check className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button variant="destructive" onClick={() => setRejectDialogOpen(true)}>
                        <X className="h-4 w-4 mr-2" />
                        Reprovar
                      </Button>
                    </>
                  )}
                  {campanha.status === 'aprovada' && (
                    <Button variant="default" onClick={handleActivate}>
                      <Play className="h-4 w-4 mr-2" />
                      Ativar
                    </Button>
                  )}
                  {(campanha.status === 'ativa' || campanha.status === 'aprovada') && (
                    <Button variant="outline" onClick={handlePause}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Tabs defaultValue="info">
                <TabsList>
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="midias">Mídias ({midias.length})</TabsTrigger>
                  <TabsTrigger value="metricas">Métricas</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Informações da Campanha</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-muted-foreground">Título</Label>
                          <p className="font-medium">{campanha.titulo}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Descrição</Label>
                          <p className="text-sm">{campanha.descricao || 'Sem descrição'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Empresa</Label>
                          <p className="font-medium">{campanha.empresa?.razao_social || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Período</Label>
                          <p className="font-medium">
                            {formatDate(campanha.data_inicio)} - {formatDate(campanha.data_fim)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Financeiro</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-muted-foreground">Orçamento Total</Label>
                          <p className="text-2xl font-bold">{formatCurrency(campanha.orcamento)}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Orçamento Utilizado</Label>
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(campanha.orcamento_utilizado)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Disponível</Label>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(campanha.orcamento - campanha.orcamento_utilizado)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {campanha.motivo_reprovacao && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Motivo da Reprovação</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-destructive">{campanha.motivo_reprovacao}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="midias" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Mídias da Campanha</CardTitle>
                          <CardDescription>Gerencie as mídias desta campanha</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingMidias ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                      ) : midias.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhuma mídia cadastrada
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {midias.map((midia) => {
                            const midiaStatus = midiaStatusConfig[midia.status]
                            return (
                              <Card key={midia.id} className="overflow-hidden">
                                <div className="aspect-video bg-muted relative">
                                  {midia.tipo === 'imagem' ? (
                                    <img
                                      src={midia.url}
                                      alt="Mídia"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <video
                                      src={midia.url}
                                      className="w-full h-full object-cover"
                                      controls
                                    />
                                  )}
                                  <Badge
                                    variant={midiaStatus.variant}
                                    className="absolute top-2 right-2"
                                  >
                                    {midiaStatus.label}
                                  </Badge>
                                </div>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {midia.tipo === 'imagem' ? (
                                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <Video className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <span className="text-sm text-muted-foreground capitalize">
                                        {midia.tipo}
                                      </span>
                                    </div>
                                    {midia.status === 'em_analise' && (
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleApproveMidia(midia.id)}
                                        >
                                          <Check className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedMidia(midia.id)
                                            setRejectMidiaDialogOpen(true)
                                          }}
                                        >
                                          <X className="h-4 w-4 text-red-600" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  {midia.motivo_reprovacao && (
                                    <p className="text-xs text-destructive mt-2">
                                      {midia.motivo_reprovacao}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="metricas" className="space-y-4">
                  <CampanhaMetrics metricas={metricas} loading={false} />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Dialog de Reprovação de Campanha */}
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

          {/* Dialog de Reprovação de Mídia */}
          <Dialog open={rejectMidiaDialogOpen} onOpenChange={setRejectMidiaDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reprovar Mídia</DialogTitle>
                <DialogDescription>Informe o motivo da reprovação</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="motivo-midia">Motivo</Label>
                  <Textarea
                    id="motivo-midia"
                    value={rejectMotivo}
                    onChange={(e) => setRejectMotivo(e.target.value)}
                    placeholder="Descreva o motivo da reprovação..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectMidiaDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleRejectMidia}>
                  Reprovar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DashboardLayout>
      </RequirePermission>
    </ProtectedRoute>
  )
}

