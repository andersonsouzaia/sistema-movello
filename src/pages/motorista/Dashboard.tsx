import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Car, DollarSign, TrendingUp, MapPin, Tablet, Wallet, HelpCircle, User, ArrowRight, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useMotoristaGanhosStats } from '@/hooks/useMotoristaGanhos'
import { formatCurrency } from '@/lib/utils/formatters'
import { SkeletonCardGrid } from '@/components/ui/SkeletonCard'

export default function MotoristaDashboard() {
  const { motorista, profile } = useAuth()
  const { stats, loading: loadingStats, refetch: refetchStats } = useMotoristaGanhosStats('mes')

  const getStatusBadge = () => {
    if (!motorista) return null

    const statusMap = {
      aguardando_aprovacao: { label: 'Aguardando Aprovação', variant: 'default' as const },
      aprovado: { label: 'Aprovado', variant: 'default' as const },
      bloqueado: { label: 'Bloqueado', variant: 'destructive' as const },
      suspenso: { label: 'Suspenso', variant: 'destructive' as const },
    }

    const status = statusMap[motorista.status] || statusMap.aguardando_aprovacao

    return (
      <Badge variant={status.variant} className="ml-2">
        {status.label}
      </Badge>
    )
  }

  const statsCards = [
    {
      label: 'Ganhos do Dia',
      value: loadingStats ? '...' : formatCurrency(stats?.ganhos_hoje || 0),
      icon: DollarSign,
      color: 'primary',
      description: 'Hoje',
    },
    {
      label: 'Ganhos do Mês',
      value: loadingStats ? '...' : formatCurrency(stats?.ganhos_mes || 0),
      icon: DollarSign,
      color: 'accent',
      description: 'Este mês',
    },
    {
      label: 'Viagens Realizadas',
      value: '0', // TODO: Implementar quando houver sistema de viagens
      icon: Car,
      color: 'primary',
      description: 'Total de viagens',
    },
    {
      label: 'Status do Tablet',
      value: motorista?.tablet_id ? 'Conectado' : 'Não vinculado',
      icon: Tablet,
      color: 'accent',
      description: motorista?.tablet_id ? 'Tablet ativo' : 'Aguardando tablet',
    },
  ]

  return (
    <ProtectedRoute requiredUserType="motorista">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-4xl font-display font-bold text-foreground mb-2">
              Dashboard
              {getStatusBadge()}
            </h1>
            <p className="text-lg text-muted-foreground">
              Bem-vindo, {profile?.nome || 'Motorista'}!
            </p>
          </motion.div>

          {/* Status Alert */}
          {motorista?.status === 'aguardando_aprovacao' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert className="border-primary/20 bg-primary/5">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <AlertDescription>
                  Sua conta está aguardando aprovação. Você terá acesso completo após a aprovação pela equipe Movello.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {motorista?.status === 'aprovado' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert className="border-primary/20 bg-primary/5">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <AlertDescription>
                  Sua conta está aprovada! Você pode começar a ganhar dinheiro exibindo anúncios.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Botão de Refresh */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchStats()}
              disabled={loadingStats}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", loadingStats && "animate-spin")} />
              Atualizar
            </Button>
          </div>

          {/* Cards de Estatísticas */}
          {loadingStats ? (
            <SkeletonCardGrid count={4} showIcon={true} showDescription={true} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {statsCards.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                >
                  <Card className="card-premium p-6 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                      <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        stat.color === 'primary' ? "bg-primary/10" : "bg-accent/10"
                      )}>
                        <Icon className={cn(
                          "h-6 w-6",
                          stat.color === 'primary' ? "text-primary" : "text-accent"
                        )} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-1">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
            </div>
          )}

          {/* Grid de Informações e Ações Rápidas */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informações do Motorista */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Informações do Veículo</CardTitle>
                  <CardDescription>Dados do seu veículo cadastrado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Veículo</p>
                      <p className="text-sm font-medium">{motorista?.veiculo || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Placa</p>
                      <p className="text-sm font-medium">{motorista?.placa || '-'}</p>
                    </div>
                    {motorista?.modelo_veiculo && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Modelo</p>
                        <p className="text-sm font-medium">{motorista.modelo_veiculo}</p>
                      </div>
                    )}
                    {motorista?.cor_veiculo && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Cor</p>
                        <p className="text-sm font-medium">{motorista.cor_veiculo}</p>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 border-t">
                    <Link to="/motorista/perfil">
                      <Button variant="outline" className="w-full gap-2">
                        <User className="h-4 w-4" />
                        Editar Perfil
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Ações Rápidas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link to="/motorista/ganhos">
                    <Button variant="outline" className="w-full justify-start gap-2" size="lg">
                      <Wallet className="h-4 w-4" />
                      Ver Ganhos
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                  <Link to="/motorista/tablet">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2" 
                      size="lg"
                    >
                      <Tablet className="h-4 w-4" />
                      {motorista?.tablet_id ? 'Gerenciar Tablet' : 'Vincular Tablet'}
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                  <Link to="/motorista/suporte">
                    <Button variant="outline" className="w-full justify-start gap-2" size="lg">
                      <HelpCircle className="h-4 w-4" />
                      Suporte
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Aviso sobre Tablet se não vinculado */}
          {motorista?.status === 'aprovado' && !motorista?.tablet_id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <Alert className="border-yellow-500/20 bg-yellow-500/5">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                  <Tablet className="h-5 w-5 text-yellow-500" />
                </div>
                <AlertDescription className="ml-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold mb-1">Vincule seu tablet para começar</p>
                      <p className="text-sm">
                        Você precisa vincular um tablet para começar a receber e exibir anúncios.
                      </p>
                    </div>
                    <Link to="/motorista/tablet">
                      <Button size="sm" className="ml-4">
                        Vincular Tablet
                      </Button>
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

