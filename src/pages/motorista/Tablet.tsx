import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Tablet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  QrCode, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Link as LinkIcon,
  Unlink
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { tabletService } from '@/services/tabletService'

const vincularTabletSchema = z.object({
  tablet_id: z.string().min(1, 'ID do tablet é obrigatório'),
})

type VincularTabletFormData = z.infer<typeof vincularTabletSchema>

export default function MotoristaTablet() {
  const { motorista, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [vincularDialogOpen, setVincularDialogOpen] = useState(false)

  const form = useForm<VincularTabletFormData>({
    resolver: zodResolver(vincularTabletSchema),
    defaultValues: {
      tablet_id: '',
    },
  })

  const handleVincularTablet = async (data: VincularTabletFormData) => {
    if (!motorista?.id) {
      toast.error('Motorista não encontrado')
      return
    }

    setLoading(true)
    try {
      // Validar tablet antes de vincular
      const validacao = await tabletService.validarTablet(data.tablet_id)

      if (!validacao.existe) {
        toast.error(validacao.mensagem)
        return
      }

      if (!validacao.disponivel) {
        toast.error(validacao.mensagem)
        return
      }

      // Vincular usando service
      const result = await tabletService.vincularTablet(motorista.id, data.tablet_id)

      if (result.sucesso) {
        setVincularDialogOpen(false)
        form.reset()
        refreshUser()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao vincular tablet'
      toast.error(errorMessage)
      console.error('Erro ao vincular tablet:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDesvincularTablet = async () => {
    if (!motorista?.id) {
      toast.error('Motorista não encontrado')
      return
    }

    if (!confirm('Tem certeza que deseja desvincular o tablet? Você precisará vinculá-lo novamente para continuar recebendo anúncios.')) {
      return
    }

    setLoading(true)
    try {
      // Desvincular usando service
      const result = await tabletService.desvincularTablet(motorista.id)

      if (result.sucesso) {
        refreshUser()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao desvincular tablet'
      toast.error(errorMessage)
      console.error('Erro ao desvincular tablet:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabletVinculado = !!motorista?.tablet_id

  return (
    <ProtectedRoute requiredUserType="motorista">
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
                Tablet
              </h1>
              <p className="text-lg text-muted-foreground">
                Vincule e gerencie seu tablet
              </p>
            </div>
            {tabletVinculado ? (
              <Button
                variant="destructive"
                onClick={handleDesvincularTablet}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Unlink className="h-4 w-4" />
                    Desvincular Tablet
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => setVincularDialogOpen(true)}
                className="gap-2"
              >
                <LinkIcon className="h-4 w-4" />
                Vincular Tablet
              </Button>
            )}
          </motion.div>

          {/* Status do Tablet */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className={cn(
              "border-2",
              tabletVinculado 
                ? "border-green-500/20 bg-green-500/5" 
                : "border-yellow-500/20 bg-yellow-500/5"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                tabletVinculado ? "bg-green-500/10" : "bg-yellow-500/10"
              )}>
                {tabletVinculado ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <AlertDescription className="ml-4">
                {tabletVinculado ? (
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400 mb-1">
                      Tablet Vinculado
                    </p>
                    <p className="text-sm">
                      Seu tablet está vinculado e pronto para exibir anúncios. ID: <strong>{motorista?.tablet_id}</strong>
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
                      Tablet Não Vinculado
                    </p>
                    <p className="text-sm">
                      Você precisa vincular um tablet para começar a receber e exibir anúncios.
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>

          {/* Card Principal */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tablet className="h-5 w-5" />
                Informações do Tablet
              </CardTitle>
              <CardDescription>
                Gerencie a conexão do seu tablet com a plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status da Conexão</Label>
                  <div className="flex items-center gap-2">
                    {tabletVinculado ? (
                      <>
                        <Wifi className="h-5 w-5 text-green-500" />
                        <Badge variant="default" className="bg-green-500">
                          Conectado
                        </Badge>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-5 w-5 text-muted-foreground" />
                        <Badge variant="secondary">
                          Desconectado
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>ID do Tablet</Label>
                  <div className="text-sm font-mono bg-muted p-2 rounded-lg">
                    {motorista?.tablet_id || 'Não vinculado'}
                  </div>
                </div>
              </div>

              {/* Instruções */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Como vincular seu tablet:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Ligue seu tablet e conecte-o à internet</li>
                  <li>Abra o aplicativo Movello no tablet</li>
                  <li>Copie o ID do tablet exibido na tela</li>
                  <li>Cole o ID no campo abaixo e clique em "Vincular Tablet"</li>
                  <li>O tablet será sincronizado automaticamente</li>
                </ol>
              </div>

              {/* Formulário de Vinculação */}
              {!tabletVinculado && (
                <div className="border-t pt-6">
                  <form onSubmit={form.handleSubmit(handleVincularTablet)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tablet_id">ID do Tablet *</Label>
                      <Input
                        id="tablet_id"
                        {...form.register('tablet_id')}
                        placeholder="Cole o ID do tablet aqui"
                        className="h-11 font-mono"
                        disabled={loading}
                      />
                      {form.formState.errors.tablet_id && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.tablet_id.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        O ID do tablet pode ser encontrado na tela inicial do aplicativo Movello no tablet
                      </p>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Vinculando...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Vincular Tablet
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {/* Informações Adicionais */}
              {tabletVinculado && (
                <div className="border-t pt-6">
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm">Dicas:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Mantenha o tablet sempre conectado à internet</li>
                      <li>Certifique-se de que o aplicativo Movello está atualizado</li>
                      <li>O tablet receberá anúncios automaticamente quando você estiver em áreas cobertas</li>
                      <li>Você pode desvincular o tablet a qualquer momento</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

