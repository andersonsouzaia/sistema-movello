import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAreasFavoritas, useCreateAreaFavorita, useDeleteAreaFavorita } from '@/hooks/useAreasFavoritas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, MapPin, Edit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MapSelector } from '@/components/empresa/MapSelector'
import { LocationRadiusPicker } from '@/components/empresa/LocationRadiusPicker'
import { CityStateSelector } from '@/components/empresa/CityStateSelector'
import { PolygonDrawer } from '@/components/empresa/PolygonDrawer'
import { LocationPreview } from '@/components/empresa/LocationPreview'
import type { LocalizacaoTipo } from '@/types/database'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

const areaFavoritaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  localizacao_tipo: z.enum(['raio', 'poligono', 'cidade', 'estado', 'regiao']),
  raio_km: z.number().min(0.5).max(50).optional(),
  centro_latitude: z.number().min(-90).max(90).optional(),
  centro_longitude: z.number().min(-180).max(180).optional(),
  poligono_coordenadas: z.array(z.tuple([z.number(), z.number()])).min(3).optional(),
  cidades: z.array(z.string()).min(1).optional(),
  estados: z.array(z.string()).min(1).optional(),
})

type AreaFavoritaFormData = z.infer<typeof areaFavoritaSchema>

export default function AreasFavoritas() {
  const navigate = useNavigate()
  const { areas, loading, error, refetch } = useAreasFavoritas()
  const { createAreaFavorita, loading: creating } = useCreateAreaFavorita()
  const { deleteAreaFavorita, loading: deleting } = useDeleteAreaFavorita()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tipoSelecionado, setTipoSelecionado] = useState<LocalizacaoTipo>('raio')

  const form = useForm<AreaFavoritaFormData>({
    resolver: zodResolver(areaFavoritaSchema),
    defaultValues: {
      nome: '',
      localizacao_tipo: 'raio',
    },
  })

  const handleSubmit = async (data: AreaFavoritaFormData) => {
    try {
      await createAreaFavorita(data)
      form.reset()
      setDialogOpen(false)
      refetch()
    } catch (error) {
      // Erro já é tratado no hook
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta área favorita?')) {
      return
    }

    try {
      await deleteAreaFavorita(id)
      refetch()
    } catch (error) {
      // Erro já é tratado no hook
    }
  }

  const handleUsarEmCampanha = (area: typeof areas[0]) => {
    // Navegar para nova campanha com dados pré-preenchidos
    navigate('/empresa/campanhas/nova', {
      state: {
        areaFavorita: area,
      },
    })
  }

  return (
    <ProtectedRoute requiredUserType="empresa">
      <DashboardLayout>
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                Áreas Favoritas
              </h1>
              <p className="text-lg text-muted-foreground">
                Gerencie suas áreas favoritas para reutilizar em campanhas
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Área Favorita
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova Área Favorita</DialogTitle>
                  <DialogDescription>
                    Crie uma área favorita para reutilizar em suas campanhas
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Área *</Label>
                    <Input
                      id="nome"
                      {...form.register('nome')}
                      placeholder="Ex: Região Central de São Paulo"
                      className="h-11"
                    />
                    {form.formState.errors.nome && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.nome.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Localização</Label>
                    <Select
                      value={form.watch('localizacao_tipo')}
                      onValueChange={(value) => {
                        form.setValue('localizacao_tipo', value as LocalizacaoTipo)
                        setTipoSelecionado(value as LocalizacaoTipo)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="raio">Raio (km)</SelectItem>
                        <SelectItem value="poligono">Polígono</SelectItem>
                        <SelectItem value="cidade">Cidade</SelectItem>
                        <SelectItem value="estado">Estado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <MapSelector
                    value={{
                      tipo: form.watch('localizacao_tipo') as LocalizacaoTipo,
                      raio_km: form.watch('raio_km'),
                      centro_latitude: form.watch('centro_latitude'),
                      centro_longitude: form.watch('centro_longitude'),
                      poligono_coordenadas: form.watch('poligono_coordenadas'),
                      cidades: form.watch('cidades'),
                      estados: form.watch('estados'),
                    }}
                    onChange={(value) => {
                      form.setValue('raio_km', value.raio_km)
                      form.setValue('centro_latitude', value.centro_latitude)
                      form.setValue('centro_longitude', value.centro_longitude)
                      form.setValue('poligono_coordenadas', value.poligono_coordenadas)
                      form.setValue('cidades', value.cidades)
                      form.setValue('estados', value.estados)
                    }}
                    tipo={tipoSelecionado}
                  />

                  {form.watch('localizacao_tipo') === 'raio' && (
                    <LocationRadiusPicker
                      value={form.watch('raio_km')}
                      onChange={(raio) => form.setValue('raio_km', raio)}
                    />
                  )}

                  {(form.watch('localizacao_tipo') === 'cidade' || form.watch('localizacao_tipo') === 'estado') && (
                    <CityStateSelector
                      cidades={form.watch('cidades')}
                      estados={form.watch('estados')}
                      onCidadesChange={(cidades) => form.setValue('cidades', cidades)}
                      onEstadosChange={(estados) => form.setValue('estados', estados)}
                      tipo={form.watch('localizacao_tipo') === 'cidade' ? 'cidade' : 'estado'}
                    />
                  )}

                  {form.watch('localizacao_tipo') === 'poligono' && (
                    <PolygonDrawer
                      value={form.watch('poligono_coordenadas')}
                      onChange={(poligono) => form.setValue('poligono_coordenadas', poligono)}
                    />
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? 'Criando...' : 'Criar Área'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>

          {loading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando áreas favoritas...</p>
            </div>
          )}

          {error && (
            <Card className="card-premium border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && areas.length === 0 && (
            <Card className="card-premium">
              <CardContent className="pt-6 text-center py-12">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Nenhuma área favorita</p>
                <p className="text-muted-foreground mb-4">
                  Crie sua primeira área favorita para reutilizar em campanhas
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Área Favorita
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && areas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {areas.map((area) => (
                <Card key={area.id} className="card-premium">
                  <CardHeader>
                    <CardTitle className="text-lg">{area.nome}</CardTitle>
                    <CardDescription>
                      <Badge variant="secondary" className="capitalize">
                        {area.localizacao_tipo}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <LocationPreview
                      tipo={area.localizacao_tipo}
                      raio_km={area.raio_km}
                      centro_latitude={area.centro_latitude}
                      centro_longitude={area.centro_longitude}
                      poligono_coordenadas={area.poligono_coordenadas}
                      cidades={area.cidades}
                      estados={area.estados}
                      readOnly
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleUsarEmCampanha(area)}
                      >
                        Usar em Campanha
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(area.id)}
                        disabled={deleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

