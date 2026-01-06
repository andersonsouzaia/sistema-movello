import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Paperclip, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/formatters'
import type { TicketComentario } from '@/types/database'
import { cn } from '@/lib/utils'

interface TicketCommentsProps {
  comments: TicketComentario[]
  loading?: boolean
  onAddComment?: (comment: string, interno: boolean, anexos?: Array<{ url: string; nome: string }>) => Promise<void>
  currentUserId?: string
}

export function TicketComments({
  comments,
  loading,
  onAddComment,
  currentUserId,
}: TicketCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])

  const handleSubmit = async () => {
    if (!newComment.trim() || !onAddComment) return

    setIsSubmitting(true)
    try {
      // Processar anexos se houver (upload para Supabase Storage)
      let anexos: Array<{ url: string; nome: string }> = []
      if (attachments.length > 0) {
        // TODO: Implementar upload de arquivos para Supabase Storage
        // Por enquanto, apenas criar estrutura básica
        anexos = attachments.map((file) => ({
          url: URL.createObjectURL(file), // URL temporária
          nome: file.name,
        }))
      }
      
      await onAddComment(newComment.trim(), isInternal, anexos)
      setNewComment('')
      setIsInternal(false)
      setAttachments([])
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comentários ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    comment.interno
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                      : 'bg-card border-border'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {comment.user?.nome || comment.user_id || 'Usuário Desconhecido'}
                      </span>
                      {comment.interno && (
                        <Badge variant="secondary" className="text-xs">
                          Interno
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(comment.criado_em || comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{comment.comentario}</p>
                  {comment.anexos && comment.anexos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {comment.anexos.map((anexo: any, index: number) => (
                        <a
                          key={index}
                          href={anexo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Paperclip className="h-3 w-3" />
                          {anexo.nome || `Anexo ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {onAddComment && (
          <div className="space-y-3 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="comment">Adicionar Comentário</Label>
              <Textarea
                id="comment"
                placeholder="Digite seu comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="internal" className="flex items-center gap-2 cursor-pointer">
                <Input
                  id="internal"
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="h-4 w-4"
                  disabled={isSubmitting}
                />
                <span className="text-sm">Comentário interno</span>
              </Label>
              <Label htmlFor="attachments" className="flex items-center gap-2 cursor-pointer">
                <Paperclip className="h-4 w-4" />
                <span className="text-sm">
                  {attachments.length > 0 ? `${attachments.length} arquivo(s)` : 'Anexar arquivos'}
                </span>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </Label>
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {file.name}
                  </Badge>
                ))}
              </div>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Comentário
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

