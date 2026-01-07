import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import type { Tag } from '@/types/database'
import { tagService } from '@/services/tagService'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface TagManagerProps {
  tags: Tag[]
  tipoRecurso?: 'tickets' | 'campanhas'
  onRefresh?: () => void
}

export function TagManager({ tags, tipoRecurso, onRefresh }: TagManagerProps) {
  const { user } = useAuth()
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<{
    nome: string
    cor: string
    tipo_recurso: 'tickets' | 'campanhas'
  }>({
    nome: '',
    cor: '#3B82F6',
    tipo_recurso: tipoRecurso || 'tickets',
  })

  const handleCreate = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome da tag é obrigatório')
      return
    }

    setLoading(true)
    try {
      await tagService.createTag({
        nome: formData.nome.trim(),
        cor: formData.cor,
        tipo_recurso: formData.tipo_recurso,
      }, user?.id || '')
      toast.success('Tag criada com sucesso!')
      setDialogOpen(false)
      resetForm()
      onRefresh?.()
    } catch (error) {
      toast.error('Erro ao criar tag')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingTag || !formData.nome.trim()) {
      toast.error('Nome da tag é obrigatório')
      return
    }

    setLoading(true)
    try {
      await tagService.updateTag(editingTag.id, {
        nome: formData.nome.trim(),
        cor: formData.cor,
        tipo_recurso: formData.tipo_recurso,
      }, user?.id || '')
      toast.success('Tag atualizada com sucesso!')
      setDialogOpen(false)
      setEditingTag(null)
      resetForm()
      onRefresh?.()
    } catch (error) {
      toast.error('Erro ao atualizar tag')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta tag?')) return

    setLoading(true)
    try {
      await tagService.deleteTag(id, user?.id || '')
      toast.success('Tag deletada com sucesso!')
      onRefresh?.()
    } catch (error) {
      toast.error('Erro ao deletar tag')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    const tipoRecursoValue = tag.tipo_recurso === 'ambos' ? 'tickets' : (tag.tipo_recurso || 'tickets')
    setFormData({
      nome: tag.nome,
      cor: tag.cor || '#3B82F6',
      tipo_recurso: tipoRecursoValue as 'tickets' | 'campanhas',
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      cor: '#3B82F6',
      tipo_recurso: tipoRecurso || 'tickets',
    })
    setEditingTag(null)
  }

  const filteredTags = tipoRecurso
    ? tags.filter((tag) => tag.tipo_recurso === tipoRecurso)
    : tags

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gerenciar Tags</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              resetForm()
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTag ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
                <DialogDescription>
                  {editingTag ? 'Edite as informações da tag' : 'Crie uma nova tag para organizar melhor seus recursos'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Tag</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Bug, Feature, Urgente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cor">Cor</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cor"
                      type="color"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                {!tipoRecurso && (
                  <div className="space-y-2">
                    <Label htmlFor="tipo_recurso">Tipo de Recurso</Label>
                    <select
                      id="tipo_recurso"
                      value={formData.tipo_recurso}
                      onChange={(e) => setFormData({ ...formData, tipo_recurso: e.target.value as 'tickets' | 'campanhas' })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="tickets">Tickets</option>
                      <option value="campanhas">Campanhas</option>
                    </select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setDialogOpen(false)
                  resetForm()
                }}>
                  Cancelar
                </Button>
                <Button onClick={editingTag ? handleUpdate : handleCreate} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingTag ? 'Atualizar' : 'Criar'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTags.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma tag encontrada. Crie uma nova tag para começar.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 p-2 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
              >
                <Badge style={{ backgroundColor: tag.cor || '#3B82F6' }} className="text-white">
                  {tag.nome}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleEdit(tag)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => handleDelete(tag.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

