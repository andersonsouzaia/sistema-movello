import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Clock, ArrowRight } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/formatters'
import { useNavigate } from 'react-router-dom'
import type { AuditLog } from '@/types/database'

interface ActivityFeedProps {
  activities: AuditLog[]
  loading?: boolean
  limit?: number
}

const actionLabels: Record<string, string> = {
  'user.create': 'Criou usuário',
  'user.role.update': 'Atualizou role',
  'user.role.remove': 'Removeu role',
  'user.password.reset': 'Resetou senha',
  'empresa.approve': 'Aprovou empresa',
  'empresa.block': 'Bloqueou empresa',
  'empresa.suspend': 'Suspendeu empresa',
  'motorista.approve': 'Aprovou motorista',
  'motorista.block': 'Bloqueou motorista',
  'motorista.suspend': 'Suspendeu motorista',
}

const resourceLabels: Record<string, string> = {
  users: 'Usuário',
  empresas: 'Empresa',
  motoristas: 'Motorista',
  campanhas: 'Campanha',
  pagamentos: 'Pagamento',
}

export function ActivityFeed({ activities, loading, limit = 10 }: ActivityFeedProps) {
  const navigate = useNavigate()
  const displayActivities = activities.slice(0, limit)

  if (loading) {
    return (
      <Card className="card-premium">
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>Últimas ações do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-premium">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>Últimas {limit} ações do sistema</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/logs')}>
          Ver Todas
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {displayActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma atividade recente
          </p>
        ) : (
          <div className="space-y-3">
            {displayActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {actionLabels[activity.action] || activity.action}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {resourceLabels[activity.resource_type] || activity.resource_type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(activity.created_at)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

