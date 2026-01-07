import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, Video, Download, Trash2, Grid3x3, List } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import type { Midia, MidiaStatus } from '@/types/database'

const midiaStatusConfig: Record<MidiaStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  em_analise: { label: 'Em Análise', variant: 'secondary' },
  aprovada: { label: 'Aprovada', variant: 'default' },
  reprovada: { label: 'Reprovada', variant: 'destructive' },
}

interface MidiaGalleryProps {
  midias: Midia[]
  viewMode?: 'grid' | 'list'
  onView?: (midia: Midia) => void
  onDownload?: (midia: Midia) => void
  onDelete?: (midiaId: string) => void
  showActions?: boolean
  loading?: boolean
  emptyMessage?: string
}

export function MidiaGallery({
  midias,
  viewMode = 'grid',
  onView,
  onDownload,
  onDelete,
  showActions = true,
  loading = false,
  emptyMessage = 'Nenhuma mídia encontrada',
}: MidiaGalleryProps) {
  const [selectedMidia, setSelectedMidia] = useState<Midia | null>(null)

  if (loading) {
    return (
      <div className={cn(
        "grid gap-4",
        viewMode === 'grid' ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
      )}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="aspect-video">
            <div className="animate-pulse bg-muted h-full" />
          </Card>
        ))}
      </div>
    )
  }

  if (midias.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {midias.map((midia) => {
          const status = midiaStatusConfig[midia.status]
          return (
            <Card key={midia.id} className="overflow-hidden group">
              <div className="aspect-video bg-muted relative">
                {midia.tipo === 'imagem' ? (
                  <img
                    src={midia.url}
                    alt={midia.id}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => onView?.(midia)}
                  />
                ) : (
                  <video
                    src={midia.url}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => onView?.(midia)}
                  />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {showActions && (
                    <>
                      {onDownload && (
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDownload(midia)
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(midia.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
                <Badge
                  variant={status.variant}
                  className="absolute top-2 right-2"
                >
                  {status.label}
                </Badge>
              </div>
              <CardContent className="p-4">
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
    )
  }

  // List view
  return (
    <div className="space-y-2">
      {midias.map((midia) => {
        const status = midiaStatusConfig[midia.status]
        return (
          <Card key={midia.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => onView?.(midia)}>
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
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {midia.tipo === 'imagem' ? 'Imagem' : 'Vídeo'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(midia.criado_em)}
                  </p>
                  {midia.motivo_reprovacao && (
                    <p className="text-xs text-destructive mt-1">{midia.motivo_reprovacao}</p>
                  )}
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
                {showActions && (
                  <div className="flex gap-2">
                    {onDownload && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDownload(midia)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(midia.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}


