import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tag } from '@/types/database'
import { tagService } from '@/services/tagService'

interface TagSelectorProps {
  selectedTags: Tag[]
  tipoRecurso: 'tickets' | 'campanhas'
  onTagsChange: (tags: Tag[]) => void
  disabled?: boolean
}

export function TagSelector({
  selectedTags,
  tipoRecurso,
  onTagsChange,
  disabled,
}: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTags()
  }, [tipoRecurso])

  const loadTags = async () => {
    setLoading(true)
    try {
      const tags = await tagService.getTags(tipoRecurso)
      setAvailableTags(tags)
    } catch (error) {
      console.error('Erro ao carregar tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id)
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            style={{ backgroundColor: tag.cor || '#3B82F6' }}
            className="text-white flex items-center gap-1"
          >
            {tag.nome}
            {!disabled && (
              <button
                onClick={() => removeTag(tag.id)}
                className="ml-1 hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        {!disabled && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-6">
                <Plus className="h-3 w-3 mr-1" />
                Adicionar Tag
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <div className="p-2">
                <div className="text-sm font-medium mb-2">Selecionar Tags</div>
                {loading ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    Carregando...
                  </div>
                ) : availableTags.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    Nenhuma tag disponível
                  </div>
                ) : (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.some((t) => t.id === tag.id)
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag)}
                          className={cn(
                            'w-full flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors text-left',
                            isSelected && 'bg-muted'
                          )}
                        >
                          <div
                            className="h-4 w-4 rounded border-2 flex items-center justify-center"
                            style={{
                              borderColor: tag.cor || '#3B82F6',
                              backgroundColor: isSelected ? tag.cor || '#3B82F6' : 'transparent',
                            }}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className="text-sm flex-1">{tag.nome}</span>
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: tag.cor || '#3B82F6' }}
                          />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
}

