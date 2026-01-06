import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useEmpresaCampanha, useUpdateCampanha, useToggleCampanha } from '@/hooks/useEmpresaCampanhas'
import { useEmpresaMidias, useUploadMidia, useDeleteMidia } from '@/hooks/useEmpresaMidias'
import { useCampanhaMetrics } from '@/hooks/useEmpresaStats'
import { useCampanhaMetricas, useCampanhaMetricasDiarias } from '@/hooks/useEmpresaMetricas'
import { useAtivarRascunho } from '@/hooks/useEmpresaRascunhos'
import { CampanhaMetricas } from '@/components/empresa/CampanhaMetricas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ArrowLeft, Edit, Pause, Play, Upload, Image as ImageIcon, Video, Loader2, Trash2, X } from 'lucide-react'
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import type { CampanhaStatus, Midia, MidiaStatus } from '@/types/database'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Progress } from '@/components/ui/progress'
import { LazyImage } from '@/utils/lazyImage'
import { cn } from '@/lib/utils'

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

const midiaStatusConfig: Record<MidiaStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  em_analise: { label: 'Em Análise', variant: 'secondary' },
  aprovada: { label: 'Aprovada', variant: 'default' },
  reprovada: { label: 'Reprovada', variant: 'destructive' },
}

const updateCampanhaSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(255, 'Título deve ter no máximo 255 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  orcamento: z.number().min(100, 'Orçamento mínimo é R$ 100,00'),
  data_inicio: z.string(),
  data_fim: z.string(),
}).refine((data) => {
  const inicio = new Date(data.data_inicio)
  const fim = new Date(data.data_fim)
  return fim > inicio
}, {
  message: 'Data de fim deve ser maior que a data de início',
  path: ['data_fim'],
})

type UpdateCampanhaFormData = z.infer<typeof updateCampanhaSchema>

export default function CampanhaDetalhes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { campanha, loading, error } = useEmpresaCampanha(id || '')
  const { midias, loading: loadingMidias, refetch: refetchMidias } = useEmpresaMidias(id || null)
  const { metrics, loading: loadingMetrics } = useCampanhaMetrics(id || null)
  const { updateCampanha, loading: updating } = useUpdateCampanha()
  const { toggleCampanha, loading: toggling } = useToggleCampanha()
  const { uploadMidia, loading: uploadingMidia } = useUploadMidia()
  const { deleteMidia, loading: deletingMidia } = useDeleteMidia()
  const { metricas: metricasConsolidadas, loading: loadingMetricas } = useCampanhaMetricas(id)
  const { metricas: metricasDiarias } = useCampanhaMetricasDiarias(id, 30)
  const { ativarRascunho, loading: ativando } = useAtivarRascunho()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedTipo, setSelectedTipo] = useState<'imagem' | 'video'>('imagem')
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
  const [activateDialogOpen, setActivateDialogOpen] = useState(false)

  const editForm = useForm<UpdateCampanhaFormData>({
    resolver: zodResolver(updateCampanhaSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      orcamento: 0,
      data_inicio: '',
      data_fim: '',
    },
  })

  useEffect(() => {
    if (campanha && editDialogOpen) {
      editForm.reset({
        titulo: campanha.titulo,
        descricao: campanha.descricao || '',
        orcamento: campanha.orcamento,
        data_inicio: campanha.data_inicio,
        data_fim: campanha.data_fim,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campanha, editDialogOpen])

  const handleUpdate = async (data: UpdateCampanhaFormData) => {
    if (!id) return
    try {
      await updateCampanha(id, data)
      setEditDialogOpen(false)
      window.location.reload()
    } catch (error) {
      // Erro já é tratado no hook
    }
  }

  const handlePause = async () => {
    if (!id) return
    try {
      await toggleCampanha(id, 'pause')
      setPauseDialogOpen(false)
      window.location.reload()
    } catch (error) {
      // Erro já é tratado no hook
    }
  }

  const handleActivate = async () => {
    if (!id) return
    try {
      await toggleCampanha(id, 'activate')
      setActivateDialogOpen(false)
      window.location.reload()
    } catch (error) {
      // Erro já é tratado no hook
    }
  }

  const handleUploadMidia = async () => {
    if (!id || !selectedFile) return
    try {
      await uploadMidia(id, selectedFile, selectedTipo)
      setUploadDialogOpen(false)
      setSelectedFile(null)
      refetchMidias()
    } catch (error) {
      // Erro já é tratado no hook
    }
  }

  const handleDeleteMidia = async (midiaId: string) => {
    try {
      await deleteMidia(midiaId)
      refetchMidias()
    } catch (error) {
      // Erro já é tratado no hook
    }
  }

  // Preparar dados para gráficos
  const metricsChartData = useMemo(() => {
    if (!metrics || metrics.length === 0) return []
    return metrics.map((m) => ({
      data: formatDate(m.data),
      visualizacoes: m.visualizacoes,
      cliques: m.cliques,
      conversoes: m.conversoes,
      gasto: m.valor_gasto,
    }))
  }, [metrics])

  const progressoOrcamento = useMemo(() => {
    if (!campanha || campanha.orcamento === 0) return 0
    return Math.min((campanha.orcamento_utilizado / campanha.orcamento) * 100, 100)
  }, [campanha])

  const podeEditar = campanha?.status === 'em_analise' || campanha?.status === 'reprovada'
  const podePausar = campanha?.status === 'ativa'
  const podeAtivar = campanha?.status === 'pausada'

  if (loading) {
    return (
      <ProtectedRoute requiredUserType="empresa">
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error || !campanha) {
    return (
      <ProtectedRoute requiredUserType="empresa">
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error || 'Campanha não encontrada'}</p>
            <Button onClick={() => navigate('/empresa/campanhas')} className="mt-4">
              Voltar para Campanhas
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const status = statusConfig[campanha.status]

  return (
    <ProtectedRoute requiredUserType="empresa">
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
              onClick={() => navigate('/empresa/campanhas')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                {campanha.titulo}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant={status.variant}>{status.label}</Badge>
                {campanha.motivo_reprovacao && (
                  <span className="text-sm text-destructive">
                    Motivo: {campanha.motivo_reprovacao}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {podeEditar && (
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Editar Campanha</DialogTitle>
                      <DialogDescription>
                        Atualize as informações da campanha
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-titulo">Título *</Label>
                        <Input
                          id="edit-titulo"
                          {...editForm.register('titulo')}
                          className="h-11"
                        />
                        {editForm.formState.errors.titulo && (
                          <p className="text-sm text-destructive">
                            {editForm.formState.errors.titulo.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-descricao">Descrição *</Label>
                        <Textarea
                          id="edit-descricao"
                          {...editForm.register('descricao')}
                          rows={4}
                        />
                        {editForm.formState.errors.descricao && (
                          <p className="text-sm text-destructive">
                            {editForm.formState.errors.descricao.message}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-orcamento">Orçamento (R$) *</Label>
                          <Input
                            id="edit-orcamento"
                            type="number"
                            step="0.01"
                            min="100"
                            {...editForm.register('orcamento', { valueAsNumber: true })}
                            className="h-11"
                          />
                          {editForm.formState.errors.orcamento && (
                            <p className="text-sm text-destructive">
                              {editForm.formState.errors.orcamento.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-data_inicio">Data Início *</Label>
                          <Input
                            id="edit-data_inicio"
                            type="date"
                            {...editForm.register('data_inicio')}
                            className="h-11"
                          />
                          {editForm.formState.errors.data_inicio && (
                            <p className="text-sm text-destructive">
                              {editForm.formState.errors.data_inicio.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-data_fim">Data Fim *</Label>
                        <Input
                          id="edit-data_fim"
                          type="date"
                          {...editForm.register('data_fim')}
                          min={editForm.watch('data_inicio')}
                          className="h-11"
                        />
                        {editForm.formState.errors.data_fim && (
                          <p className="text-sm text-destructive">
                            {editForm.formState.errors.data_fim.message}
                          </p>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={updating}>
                          {updating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            'Salvar Alterações'
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
              {podePausar && (
                <>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setPauseDialogOpen(true)}
                  >
                    <Pause className="h-4 w-4" />
                    Pausar
                  </Button>
                  <ConfirmDialog
                    open={pauseDialogOpen}
                    onOpenChange={setPauseDialogOpen}
                    title="Pausar Campanha"
                    description="Tem certeza que deseja pausar esta campanha? Ela não será exibida até ser reativada."
                    onConfirm={handlePause}
                    confirmText="Pausar"
                    loading={toggling}
                  />
                </>
              )}
              {podeAtivar && (
                <>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setActivateDialogOpen(true)}
                  >
                    <Play className="h-4 w-4" />
                    Ativar
                  </Button>
                  <ConfirmDialog
                    open={activateDialogOpen}
                    onOpenChange={setActivateDialogOpen}
                    title="Ativar Campanha"
                    description="Tem certeza que deseja ativar esta campanha? Ela será exibida novamente."
                    onConfirm={handleActivate}
                    confirmText="Ativar"
                    loading={toggling}
                  />
                </>
              )}
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="info" className="space-y-6">
            <TabsList>
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="midias">Mídias</TabsTrigger>
              <TabsTrigger value="metricas">Métricas</TabsTrigger>
            </TabsList>

            {/* Tab: Informações */}
            <TabsContent value="info" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle>Informações da Campanha</CardTitle>
                    <CardDescription>Dados principais</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge variant={status.variant} className="mt-1">{status.label}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Título</p>
                      <p className="text-sm">{campanha.titulo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                      <p className="text-sm">{campanha.descricao || 'Sem descrição'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Início</p>
                      <p className="text-sm">{formatDate(campanha.data_inicio)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Fim</p>
                      <p className="text-sm">{formatDate(campanha.data_fim)}</p>
                    </div>
                    {campanha.aprovado_em && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Aprovada em</p>
                        <p className="text-sm">{formatDateTime(campanha.aprovado_em)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle>Orçamento</CardTitle>
                    <CardDescription>Controle financeiro</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-muted-foreground">Orçamento Total</p>
                        <p className="text-lg font-bold">{formatCurrency(campanha.orcamento)}</p>
                      </div>
                      <Progress value={progressoOrcamento} className="h-2" />
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-muted-foreground">Utilizado</p>
                        <p className="text-xs font-medium">
                          {formatCurrency(campanha.orcamento_utilizado || 0)} ({progressoOrcamento.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Saldo Disponível</p>
                      <p className={cn(
                        "text-lg font-bold",
                        (campanha.orcamento - (campanha.orcamento_utilizado || 0)) < 100 ? "text-yellow-500" : "text-primary"
                      )}>
                        {formatCurrency(campanha.orcamento - (campanha.orcamento_utilizado || 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Criada em</p>
                      <p className="text-sm">{formatDateTime(campanha.criado_em)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Mídias */}
            <TabsContent value="midias" className="space-y-6">
              <Card className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Mídias da Campanha</CardTitle>
                    <CardDescription>Gerencie as mídias desta campanha</CardDescription>
                  </div>
                  {podeEditar && (
                    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Upload className="h-4 w-4" />
                          Adicionar Mídia
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload de Mídia</DialogTitle>
                          <DialogDescription>
                            Envie uma imagem ou vídeo para a campanha
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Tipo de Mídia</Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={selectedTipo === 'imagem' ? 'default' : 'outline'}
                                onClick={() => setSelectedTipo('imagem')}
                                className="flex-1"
                              >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Imagem
                              </Button>
                              <Button
                                type="button"
                                variant={selectedTipo === 'video' ? 'default' : 'outline'}
                                onClick={() => setSelectedTipo('video')}
                                className="flex-1"
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Vídeo
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="file">Arquivo</Label>
                            <Input
                              id="file"
                              type="file"
                              accept={selectedTipo === 'imagem' ? 'image/*' : 'video/*'}
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Tamanho máximo: 10MB
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setUploadDialogOpen(false)
                              setSelectedFile(null)
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleUploadMidia}
                            disabled={!selectedFile || uploadingMidia}
                          >
                            {uploadingMidia ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              'Enviar'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {loadingMidias ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : midias.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nenhuma mídia adicionada ainda</p>
                      {podeEditar && (
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setUploadDialogOpen(true)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Adicionar Primeira Mídia
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {midias.map((midia) => {
                        const midiaStatus = midiaStatusConfig[midia.status]
                        return (
                          <Card key={midia.id} className="overflow-hidden">
                            <div className="aspect-video bg-muted relative">
                              {midia.tipo === 'imagem' ? (
                                <LazyImage
                                  src={midia.url}
                                  alt={midia.id}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <video
                                  src={midia.url}
                                  className="w-full h-full object-cover"
                                  controls
                                  preload="metadata"
                                />
                              )}
                              <Badge
                                variant={midiaStatus.variant}
                                className="absolute top-2 right-2"
                              >
                                {midiaStatus.label}
                              </Badge>
                              {podeEditar && (
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 left-2"
                                  onClick={() => handleDeleteMidia(midia.id)}
                                  disabled={deletingMidia}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <p className="text-xs text-muted-foreground">
                                {midia.tipo === 'imagem' ? 'Imagem' : 'Vídeo'}
                              </p>
                              {midia.motivo_reprovacao && (
                                <p className="text-xs text-destructive mt-1">
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

            {/* Tab: Métricas */}
            <TabsContent value="metricas" className="space-y-6">
              <CampanhaMetricas
                metricasConsolidadas={metricasConsolidadas}
                metricasDiarias={metricasDiarias}
                kpisMeta={campanha.kpis_meta}
                loading={loadingMetricas}
              />
              {campanha.is_rascunho && !campanha.saldo_insuficiente && (
                <Card className="card-premium">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Rascunho Pronto para Ativar</h3>
                        <p className="text-sm text-muted-foreground">
                          Esta campanha está salva como rascunho e pode ser ativada agora.
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          if (id) {
                            try {
                              const resultado = await ativarRascunho(id)
                              if (resultado.sucesso) {
                                window.location.reload()
                              }
                            } catch (error) {
                              // Erro já tratado no hook
                            }
                          }
                        }}
                        disabled={ativando}
                      >
                        {ativando ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Ativando...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Ativar Campanha
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
