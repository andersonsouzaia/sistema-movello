import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Download, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'
import type { Midia, MidiaStatus } from '@/types/database'

const midiaStatusConfig: Record<MidiaStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  em_analise: { label: 'Em Análise', variant: 'secondary' },
  aprovada: { label: 'Aprovada', variant: 'default' },
  reprovada: { label: 'Reprovada', variant: 'destructive' },
}

interface MidiaPreviewProps {
  midia: Midia | null
  open: boolean
  onClose: () => void
  onDownload?: (midia: Midia) => void
  onDelete?: (midiaId: string) => void
}

export function MidiaPreview({
  midia,
  open,
  onClose,
  onDownload,
  onDelete,
}: MidiaPreviewProps) {
  if (!midia) return null

  const status = midiaStatusConfig[midia.status]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Preview da Mídia</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative bg-muted rounded-lg overflow-hidden">
            {midia.tipo === 'imagem' ? (
              <img
                src={midia.url}
                alt={midia.id}
                className="w-full h-auto max-h-[60vh] object-contain mx-auto"
              />
            ) : (
              <video
                src={midia.url}
                controls
                className="w-full h-auto max-h-[60vh] mx-auto"
              />
            )}
          </div>

          {/* Informações */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Tipo</p>
              <p className="font-medium">{midia.tipo === 'imagem' ? 'Imagem' : 'Vídeo'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Criado em</p>
              <p className="font-medium">{formatDate(midia.criado_em)}</p>
            </div>
            {midia.motivo_reprovacao && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Motivo da Reprovação</p>
                <p className="text-destructive">{midia.motivo_reprovacao}</p>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex gap-2 justify-end">
            {onDownload && (
              <Button variant="outline" onClick={() => onDownload(midia)}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" onClick={() => onDelete(midia.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

