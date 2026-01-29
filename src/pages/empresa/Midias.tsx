import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useEmpresaCampanhas } from '@/hooks/useEmpresaCampanhas'
import { useEmpresaMidias, useUploadMidia, useDeleteMidia } from '@/hooks/useEmpresaMidias'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Upload, Image as ImageIcon, Video, Trash2, Grid3x3, List, Loader2, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Midia, MidiaStatus } from '@/types/database'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/formatters'
import { LazyImage } from '@/utils/lazyImage'

const midiaStatusConfig: Record<MidiaStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  em_analise: { label: 'Em Análise', variant: 'secondary' },
  aprovada: { label: 'Aprovada', variant: 'default' },
  reprovada: { label: 'Reprovada', variant: 'destructive' },
}

export default function EmpresaMidias() {
  const { empresa } = useAuth()
  const { campanhas } = useEmpresaCampanhas({})
  const [campanhaFilter, setCampanhaFilter] = useState<string>('')
  const [tipoFilter, setTipoFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedTipo, setSelectedTipo] = useState<'imagem' | 'video'>('imagem')
  const [selectedCampanha, setSelectedCampanha] = useState<string>('')
  const { uploadMidia, loading: uploadingMidia } = useUploadMidia()
  const { deleteMidia, loading: deletingMidia } = useDeleteMidia()

  // Buscar mídias de todas as campanhas
  const todasMidias: Array<Midia & { campanha_titulo?: string }> = []

  // Para cada campanha, buscar suas mídias
  campanhas.forEach((campanha) => {
    // Usar hook para cada campanha (simplificado - em produção usar query agregada)
    // Por enquanto, vamos buscar todas as mídias de uma vez
  })

  // Buscar mídias diretamente do Supabase filtradas por empresa
  const [midias, setMidias] = useState<Array<Midia & { campanha_titulo?: string }>>([])
  const [loading, setLoading] = useState(true)

  const fetchAllMidias = useCallback(async () => {
    if (!empresa?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Buscar todas as campanhas da empresa e suas mídias
      const { data: campanhasData } = await supabase
        .from('campanhas')
        .select('id, titulo')
        .eq('empresa_id', empresa.id)

      if (!campanhasData || campanhasData.length === 0) {
        setMidias([])
        setLoading(false)
        return
      }

      const campanhaIds = campanhasData.map((c) => c.id)
      const campanhaMap = new Map(campanhasData.map((c) => [c.id, c.titulo]))

      const { data: midiasData, error } = await supabase
        .from('midias')
        .select('*')
        .in('campanha_id', campanhaIds)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      const midiasComCampanha = (midiasData || []).map((midia) => ({
        ...midia,
        campanha_titulo: campanhaMap.get(midia.campanha_id),
      }))

      setMidias(midiasComCampanha as Array<Midia & { campanha_titulo?: string }>)
    } catch (error) {
      console.error('Erro ao buscar mídias:', error)
      toast.error('Erro ao buscar mídias')
      setMidias([])
    } finally {
      setLoading(false)
    }
  }, [empresa?.id])

  useEffect(() => {
    fetchAllMidias()
  }, [fetchAllMidias])

  const filteredMidias = useMemo(() => {
    return midias.filter((midia) => {
      if (campanhaFilter && midia.campanha_id !== campanhaFilter) return false
      if (tipoFilter && midia.tipo !== tipoFilter) return false
      if (statusFilter && midia.status !== statusFilter) return false
      return true
    })
  }, [midias, campanhaFilter, tipoFilter, statusFilter])

  const handleUploadMultiple = async () => {
    if (!selectedCampanha || selectedFiles.length === 0) {
      toast.error('Selecione uma campanha e pelo menos um arquivo')
      return
    }

    try {
      for (const file of selectedFiles) {
        const tipo = file.type.startsWith('video/') ? 'video' : 'imagem'
        await uploadMidia(selectedCampanha, file, tipo, undefined)
      }
      setUploadDialogOpen(false)
      setSelectedFiles([])
      setSelectedCampanha('')
      // Recarregar mídias
      await fetchAllMidias()
    } catch (error) {
      // Erro já é tratado no hook
    }
  }

  const handleDeleteMidia = async (midiaId: string) => {
    try {
      await deleteMidia(midiaId)
      setMidias((prev) => prev.filter((m) => m.id !== midiaId))
    } catch (error) {
      // Erro já é tratado no hook
    }
  }

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
                Mídias
              </h1>
              <p className="text-lg text-muted-foreground">
                Gerencie suas mídias e materiais publicitários
              </p>
            </div>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload em Massa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle>Upload em Massa</DialogTitle>
                  <DialogDescription>
                    Envie múltiplas mídias de uma vez para uma campanha
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Campanha</Label>
                    <Select value={selectedCampanha} onValueChange={setSelectedCampanha}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma campanha" />
                      </SelectTrigger>
                      <SelectContent>
                        {campanhas.map((campanha) => (
                          <SelectItem key={campanha.id} value={campanha.id}>
                            {campanha.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                    <Label htmlFor="files">Arquivos</Label>
                    <Input
                      id="files"
                      type="file"
                      multiple
                      accept={selectedTipo === 'imagem' ? 'image/*' : 'video/*'}
                      onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                    />
                    <p className="text-xs text-muted-foreground">
                      {selectedFiles.length} arquivo(s) selecionado(s). Tamanho máximo: 10MB por arquivo
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setUploadDialogOpen(false)
                      setSelectedFiles([])
                      setSelectedCampanha('')
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUploadMultiple}
                    disabled={!selectedCampanha || selectedFiles.length === 0 || uploadingMidia}
                  >
                    {uploadingMidia ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      `Enviar ${selectedFiles.length} arquivo(s)`
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Filtros */}
          <Card className="card-premium">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Campanha</Label>
                  <Select value={campanhaFilter} onValueChange={(value) => setCampanhaFilter(value === '__all__' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as campanhas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas as campanhas</SelectItem>
                      {campanhas.map((campanha) => (
                        <SelectItem key={campanha.id} value={campanha.id}>
                          {campanha.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={tipoFilter} onValueChange={(value) => setTipoFilter(value === '__all__' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos os tipos</SelectItem>
                      <SelectItem value="imagem">Imagem</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value === '__all__' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos os status</SelectItem>
                      <SelectItem value="em_analise">Em Análise</SelectItem>
                      <SelectItem value="aprovada">Aprovada</SelectItem>
                      <SelectItem value="reprovada">Reprovada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos os tipos</SelectItem>
                      <SelectItem value="imagem">Imagem</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos os status</SelectItem>
                      <SelectItem value="em_analise">Em Análise</SelectItem>
                      <SelectItem value="aprovada">Aprovada</SelectItem>
                      <SelectItem value="reprovada">Reprovada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visualização</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Galeria */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="aspect-video">
                  <div className="animate-pulse bg-muted h-full" />
                </Card>
              ))}
            </div>
          ) : filteredMidias.length === 0 ? (
            <Card className="card-premium">
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Nenhuma mídia encontrada</p>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Mídia
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMidias.map((midia) => {
                const midiaStatus = midiaStatusConfig[midia.status]
                return (
                  <Card key={midia.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted relative group">
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
                      <div className="absolute top-2 left-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-background/80 hover:bg-background backdrop-blur-sm"
                          onClick={() => window.open(midia.url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteMidia(midia.id)}
                          disabled={deletingMidia}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Badge
                        variant={midiaStatus.variant}
                        className="absolute top-2 right-2"
                      >
                        {midiaStatus.label}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium">{midia.campanha_titulo || 'Sem campanha'}</p>
                      <p className="text-xs text-muted-foreground">
                        {midia.tipo === 'imagem' ? 'Imagem' : 'Vídeo'} • {formatDate(midia.criado_em)}
                      </p>
                      {midia.motivo_reprovacao && (
                        <p className="text-xs text-destructive mt-1">{midia.motivo_reprovacao}</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMidias.map((midia) => {
                const midiaStatus = midiaStatusConfig[midia.status]
                return (
                  <Card key={midia.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {midia.tipo === 'imagem' ? (
                            <img
                              src={midia.url}
                              alt={midia.id}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{midia.campanha_titulo || 'Sem campanha'}</p>
                          <p className="text-sm text-muted-foreground">
                            {midia.tipo === 'imagem' ? 'Imagem' : 'Vídeo'} • {formatDate(midia.criado_em)}
                          </p>
                          {midia.motivo_reprovacao && (
                            <p className="text-xs text-destructive mt-1">{midia.motivo_reprovacao}</p>
                          )}
                        </div>
                        <Badge variant={midiaStatus.variant}>{midiaStatus.label}</Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(midia.url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMidia(midia.id)}
                            disabled={deletingMidia}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
