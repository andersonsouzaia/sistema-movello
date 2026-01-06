import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useCampanhaTemplates, useCreateTemplate, useCampanhaFromTemplate } from '@/hooks/useCampanhaTemplates'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, FileText, Copy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const templateSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional(),
})

type TemplateFormData = z.infer<typeof templateSchema>

export default function Templates() {
  const navigate = useNavigate()
  const { templates, loading, error, refetch } = useCampanhaTemplates()
  const { createTemplate, loading: creating } = useCreateTemplate()
  const { createCampanhaFromTemplate, loading: creatingCampanha } = useCampanhaFromTemplate()
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      nome: '',
      descricao: '',
    },
  })

  const handleSubmit = async (data: TemplateFormData) => {
    try {
      await createTemplate(data)
      form.reset()
      setDialogOpen(false)
      refetch()
    } catch (error) {
      // Erro já é tratado no hook
    }
  }

  const handleUsarTemplate = async (templateId: string) => {
    try {
      const campanhaId = await createCampanhaFromTemplate(templateId)
      navigate(`/empresa/campanhas/${campanhaId}`)
    } catch (error) {
      // Erro já é tratado no hook
    }
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
                Templates de Campanha
              </h1>
              <p className="text-lg text-muted-foreground">
                Crie e gerencie templates para facilitar a criação de campanhas
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Template</DialogTitle>
                  <DialogDescription>
                    Crie um template básico. Você pode editar os detalhes depois.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Template *</Label>
                    <Input
                      id="nome"
                      {...form.register('nome')}
                      placeholder="Ex: Template Verão 2024"
                      className="h-11"
                    />
                    {form.formState.errors.nome && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.nome.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      {...form.register('descricao')}
                      placeholder="Descreva o template..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? 'Criando...' : 'Criar Template'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>

          {loading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando templates...</p>
            </div>
          )}

          {error && (
            <Card className="card-premium border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && templates.length === 0 && (
            <Card className="card-premium">
              <CardContent className="pt-6 text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Nenhum template</p>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro template para facilitar a criação de campanhas
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Template
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && templates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="card-premium">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.nome}</CardTitle>
                    <CardDescription>
                      {template.descricao || 'Sem descrição'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {template.nicho && (
                        <Badge variant="secondary" className="capitalize">
                          {template.nicho}
                        </Badge>
                      )}
                      {template.objetivo_principal && (
                        <Badge variant="outline" className="capitalize">
                          {template.objetivo_principal}
                        </Badge>
                      )}
                      {template.estrategia && (
                        <Badge variant="outline" className="uppercase">
                          {template.estrategia}
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      {template.categorias && template.categorias.length > 0 && (
                        <p>
                          <strong>Categorias:</strong> {template.categorias.join(', ')}
                        </p>
                      )}
                      {template.localizacao_tipo && (
                        <p>
                          <strong>Localização:</strong> {template.localizacao_tipo}
                        </p>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handleUsarTemplate(template.id)}
                      disabled={creatingCampanha}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {creatingCampanha ? 'Criando...' : 'Usar Template'}
                    </Button>
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

