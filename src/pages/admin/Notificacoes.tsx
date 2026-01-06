import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { useNotifications } from '@/hooks/useNotifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/formatters'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const typeIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
}

const typeColors = {
  info: 'text-blue-600 bg-blue-50 border-blue-200',
  success: 'text-green-600 bg-green-50 border-green-200',
  warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  error: 'text-red-600 bg-red-50 border-red-200',
}

export default function AdminNotificacoes() {
  const navigate = useNavigate()
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications()
  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  return (
    <ProtectedRoute requiredUserType="admin">
      <RequirePermission permission="users.read">
        <DashboardLayout>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                  Notificações
                </h1>
                <p className="text-lg text-muted-foreground">
                  Gerencie suas notificações do sistema
                </p>
              </div>
              {unreadNotifications.length > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Marcar Todas como Lidas
                </Button>
              )}
            </motion.div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="unread" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="unread">
                    Não Lidas ({unreadNotifications.length})
                  </TabsTrigger>
                  <TabsTrigger value="all">
                    Todas ({notifications.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="unread">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {unreadNotifications.length === 0 ? (
                      <Card className="card-premium">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Nenhuma notificação não lida</h3>
                          <p className="text-sm text-muted-foreground">
                            Você está em dia com todas as notificações!
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {unreadNotifications.map((notification, index) => {
                          const Icon = typeIcons[notification.type]
                          return (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                              <Card
                                className={cn(
                                  'card-premium cursor-pointer hover:shadow-lg transition-all',
                                  typeColors[notification.type]
                                )}
                                onClick={() => {
                                  markAsRead(notification.id)
                                  if (notification.link) {
                                    navigate(notification.link)
                                  }
                                }}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                      <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="font-semibold">{notification.title}</h3>
                                        <Badge variant="outline" className="text-xs">
                                          {notification.type}
                                        </Badge>
                                      </div>
                                      <p className="text-sm mb-2">{notification.message}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatDateTime(notification.created_at)}
                                      </p>
                                    </div>
                                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                </TabsContent>

                <TabsContent value="all">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {notifications.length === 0 ? (
                      <Card className="card-premium">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Nenhuma notificação</h3>
                          <p className="text-sm text-muted-foreground">
                            Você ainda não recebeu nenhuma notificação.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {notifications.map((notification, index) => {
                          const Icon = typeIcons[notification.type]
                          return (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                              <Card
                                className={cn(
                                  'card-premium cursor-pointer hover:shadow-lg transition-all',
                                  !notification.read && typeColors[notification.type],
                                  notification.read && 'opacity-75'
                                )}
                                onClick={() => {
                                  if (!notification.read) {
                                    markAsRead(notification.id)
                                  }
                                  if (notification.link) {
                                    navigate(notification.link)
                                  }
                                }}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                      <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="font-semibold">{notification.title}</h3>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">
                                            {notification.type}
                                          </Badge>
                                          {notification.read && (
                                            <Badge variant="secondary" className="text-xs">
                                              Lida
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-sm mb-2">{notification.message}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatDateTime(notification.created_at)}
                                      </p>
                                    </div>
                                    {!notification.read && (
                                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DashboardLayout>
      </RequirePermission>
    </ProtectedRoute>
  )
}

