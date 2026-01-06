import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Play, Edit, Copy, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useRascunhos, useAtivarRascunho } from '@/hooks/useEmpresaRascunhos'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Campanha } from '@/types/database'

interface RascunhosListProps {
  className?: string
  onAtivar?: () => void
}

export function RascunhosList({ className, onAtivar }: RascunhosListProps) {
  const navigate = useNavigate()
  const { rascunhos, loading, error, refetch } = useRascunhos()
  const { ativarRascunho, loading: ativando } = useAtivarRascunho()
  const [ativarDialogOpen, setAtivarDialogOpen] = useState(false)
  const [deletarDialogOpen, setDeletarDialogOpen] = useState(false)
  const [rascunhoSelecionado, setRascunhoSelecionado] = useState<Campanha | null>(null)

  const handleAtivar = async (rascunho: Campanha) => {
    try {
      const resultado = await ativarRascunho(rascunho.id)
      if (resultado.sucesso) {
        setAtivarDialogOpen(false)
        refetch()
        onAtivar?.()
      } else {
        // Saldo insuficiente - já mostrado no toast pelo serviço
        setAtivarDialogOpen(false)
      }
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  const handleDuplicar = (rascunho: Campanha) => {
    // Navegar para criação de campanha com dados pré-preenchidos
    // TODO: Implementar duplicação real
    toast.info('Funcionalidade de duplicação em breve')
  }

  const handleDeletar = async (rascunho: Campanha) => {
    try {
      // TODO: Implementar deleção
      toast.info('Funcionalidade de deleção em breve')
      setDeletarDialogOpen(false)
    } catch (error) {
      // Erro já tratado
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Rascunhos</CardTitle>
          <CardDescription>Campanhas salvas como rascunho</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Rascunhos</CardTitle>
          <CardDescription>Campanhas salvas como rascunho</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (rascunhos.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Rascunhos</CardTitle>
          <CardDescription>Campanhas salvas como rascunho</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Nenhum rascunho salvo</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Rascunhos</CardTitle>
          <CardDescription>Campanhas salvas como rascunho</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rascunhos.map((rascunho) => (
              <div
                key={rascunho.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{rascunho.titulo}</h3>
                    <Badge variant="secondary">Rascunho</Badge>
                    {rascunho.saldo_insuficiente && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Saldo Insuficiente
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>Orçamento: {formatCurrency(rascunho.orcamento)}</span>
                    {rascunho.rascunho_salvo_em && (
                      <span>Salvo em: {formatDate(rascunho.rascunho_salvo_em)}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!rascunho.saldo_insuficiente && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setRascunhoSelecionado(rascunho)
                        setAtivarDialogOpen(true)
                      }}
                      disabled={ativando}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Ativar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/empresa/campanhas/nova?rascunho=${rascunho.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Continuar Editando
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicar(rascunho)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRascunhoSelecionado(rascunho)
                      setDeletarDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Ativação */}
      <Dialog open={ativarDialogOpen} onOpenChange={setAtivarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ativar Rascunho</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja ativar este rascunho? A campanha será enviada para análise.
            </DialogDescription>
          </DialogHeader>
          {rascunhoSelecionado && (
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Título:</strong> {rascunhoSelecionado.titulo}
              </p>
              <p className="text-sm">
                <strong>Orçamento:</strong> {formatCurrency(rascunhoSelecionado.orcamento)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAtivarDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => rascunhoSelecionado && handleAtivar(rascunhoSelecionado)}
              disabled={ativando}
            >
              {ativando ? 'Ativando...' : 'Ativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Deleção */}
      <Dialog open={deletarDialogOpen} onOpenChange={setDeletarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Rascunho</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar este rascunho? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {rascunhoSelecionado && (
            <p className="text-sm">
              <strong>Título:</strong> {rascunhoSelecionado.titulo}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletarDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => rascunhoSelecionado && handleDeletar(rascunhoSelecionado)}
            >
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

