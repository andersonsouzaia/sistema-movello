import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/formatters'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types/database'

interface NotificationBellProps {
  notifications: Notification[]
  unreadCount: number
  loading?: boolean
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
}

const typeIcons = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
}

const typeColors = {
  info: 'text-blue-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
}

export function NotificationBell({
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationBellProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    if (notification.link) {
      navigate(notification.link)
      setOpen(false)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Badge
                variant="destructive"
                className="flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </motion.div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="font-semibold">Notificações</DropdownMenuLabel>
          {unreadCount > 0 && onMarkAllAsRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                onMarkAllAsRead()
              }}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Marcar todas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    'flex flex-col items-start gap-1 p-3 cursor-pointer',
                    !notification.read && 'bg-muted/50'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('text-sm', typeColors[notification.type])}>
                          {typeIcons[notification.type]}
                        </span>
                        <span className="text-sm font-medium truncate">{notification.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer justify-center"
              onClick={() => {
                navigate('/admin/notificacoes')
                setOpen(false)
              }}
            >
              Ver todas as notificações
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

