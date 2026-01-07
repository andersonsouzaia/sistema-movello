import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Midia } from '@/types/database'

interface MidiaReorderProps {
  midias: Midia[]
  onReorder: (midias: Array<{ id: string; ordem: number }>) => Promise<void>
  loading?: boolean
}

export function MidiaReorder({
  midias,
  onReorder,
  loading = false,
}: MidiaReorderProps) {
  const [orderedMidias, setOrderedMidias] = useState<Midia[]>(midias)

  const moveUp = (index: number) => {
    if (index === 0) return
    const newOrder = [...orderedMidias]
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    setOrderedMidias(newOrder)
  }

  const moveDown = (index: number) => {
    if (index === orderedMidias.length - 1) return
    const newOrder = [...orderedMidias]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    setOrderedMidias(newOrder)
  }

  const handleSave = async () => {
    const reordered = orderedMidias.map((midia, index) => ({
      id: midia.id,
      ordem: index + 1,
    }))
    await onReorder(reordered)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {orderedMidias.map((midia, index) => (
          <Card key={midia.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground w-8">
                    {index + 1}
                  </span>
                </div>
                <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                  {midia.tipo === 'imagem' ? (
                    <img
                      src={midia.url}
                      alt={midia.id}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Vídeo</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {midia.tipo === 'imagem' ? 'Imagem' : 'Vídeo'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveUp(index)}
                    disabled={index === 0 || loading}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveDown(index)}
                    disabled={index === orderedMidias.length - 1 || loading}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button
        onClick={handleSave}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Salvando...' : 'Salvar Ordem'}
      </Button>
    </div>
  )
}


