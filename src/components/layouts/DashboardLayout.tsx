import { ReactNode, useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications, useNotificationCount } from '@/hooks/useNotifications'
import { NotificationBell } from '@/components/admin/NotificationBell'
import { GlobalSearch } from '@/components/admin/GlobalSearch'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  LayoutDashboard,
  Building2,
  Car,
  Settings,
  LogOut,
  Menu,
  X,
  AlertCircle,
  Search,
} from 'lucide-react'
import movelloLogo from '@/assets/movello-logo.png'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: ReactNode
}

const getNavigationItems = (userType: string | null) => {
  if (userType === 'empresa') {
    return [
      { label: 'Dashboard', path: '/empresa/dashboard', icon: LayoutDashboard },
      { label: 'Campanhas', path: '/empresa/campanhas', icon: Building2 },
      { label: 'Mídias', path: '/empresa/midias', icon: Building2 },
      { label: 'Pagamentos', path: '/empresa/pagamentos', icon: Settings },
      { label: 'Perfil', path: '/empresa/perfil', icon: Settings },
      { label: 'Suporte', path: '/empresa/suporte', icon: Settings },
    ]
  }

  if (userType === 'motorista') {
    return [
      { label: 'Dashboard', path: '/motorista/dashboard', icon: LayoutDashboard },
      { label: 'Ganhos', path: '/motorista/ganhos', icon: Car },
      { label: 'Tablet', path: '/motorista/tablet', icon: Car },
      { label: 'Perfil', path: '/motorista/perfil', icon: Settings },
      { label: 'Suporte', path: '/motorista/suporte', icon: Settings },
    ]
  }

  if (userType === 'admin') {
    return [
      { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Empresas', path: '/admin/empresas', icon: Building2 },
      { label: 'Motoristas', path: '/admin/motoristas', icon: Car },
      { label: 'Campanhas', path: '/admin/campanhas', icon: Building2 },
      { label: 'Pagamentos', path: '/admin/pagamentos', icon: Settings },
      { label: 'Suporte', path: '/admin/suporte', icon: Settings },
      { label: 'Roles', path: '/admin/roles', icon: Settings },
      { label: 'Logs', path: '/admin/logs', icon: Settings },
      { label: 'Relatórios', path: '/admin/relatorios', icon: Settings },
      { label: 'Configurações', path: '/admin/configuracoes', icon: Settings },
    ]
  }

  return []
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, profile, empresa, motorista, admin, userType, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  // Buscar todas as notificações para o NotificationBell
  const { notifications, markAsRead, markAllAsRead, loading: notificationsLoading } = useNotifications()
  const { count: unreadCount } = useNotificationCount()

  // Atalho Ctrl+K para busca global
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen])

  const navigationItems = getNavigationItems(userType)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const getUserInitials = () => {
    if (profile?.nome) {
      return profile.nome
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.[0].toUpperCase() || 'U'
  }

  const getUserName = () => {
    if (profile?.nome) return profile.nome
    if (empresa?.nome_fantasia) return empresa.nome_fantasia
    if (empresa?.razao_social) return empresa.razao_social
    return user?.email || 'Usuário'
  }

  const getStatusMessage = () => {
    if (empresa?.status === 'aguardando_aprovacao') {
      return {
        type: 'warning' as const,
        message: 'Sua conta está aguardando aprovação. Você terá acesso completo após a aprovação.',
      }
    }

    if (motorista?.status === 'aguardando_aprovacao') {
      return {
        type: 'warning' as const,
        message: 'Sua conta está aguardando aprovação. Você terá acesso completo após a aprovação.',
      }
    }

    return null
  }

  const statusMessage = getStatusMessage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-card/80 backdrop-blur-xl border-r border-border/50 shadow-xl">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center flex-shrink-0 px-4 mb-8"
          >
            <Link to={`/${userType}/dashboard`} className="group">
              <img src={movelloLogo} alt="Movello" className="h-10 w-auto transition-transform group-hover:scale-105" />
            </Link>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-2">
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    className={cn(
                      'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300',
                      isActive
                        ? 'bg-gradient-to-r from-primary to-movello-blue-dark text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground hover:translate-x-1'
                    )}
                  >
                    <div className={cn(
                      'mr-3 h-10 w-10 rounded-xl flex items-center justify-center transition-all',
                      isActive
                        ? 'bg-primary-foreground/20'
                        : 'bg-primary/10 group-hover:bg-primary/20'
                    )}>
                      <Icon className="h-5 w-5 flex-shrink-0" />
                    </div>
                    {item.label}
                  </Link>
                </motion.div>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-xl border-r border-border shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <img src={movelloLogo} alt="Movello" className="h-8 w-auto" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300',
                        isActive
                          ? 'bg-gradient-to-r from-primary to-movello-blue-dark text-primary-foreground shadow-lg'
                          : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                      )}
                    >
                      <div className={cn(
                        'mr-3 h-10 w-10 rounded-xl flex items-center justify-center transition-all',
                        isActive
                          ? 'bg-primary-foreground/20'
                          : 'bg-primary/10 group-hover:bg-primary/20'
                      )}>
                        <Icon className="h-5 w-5 flex-shrink-0" />
                      </div>
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-primary/10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-2 sm:gap-x-4 self-stretch lg:gap-x-6">
            {/* Busca Global - apenas para admin */}
            {userType === 'admin' && (
              <>
                {/* Versão Desktop - Campo completo */}
                <div className="hidden sm:flex flex-1 max-w-md">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Buscar...
                    <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </Button>
                </div>
                {/* Versão Mobile - Ícone apenas */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Buscar"
                >
                  <Search className="h-5 w-5" />
                </Button>
                <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
              </>
            )}
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-2 sm:gap-x-4 lg:gap-x-6">
              {/* Notifications - apenas para admin */}
              {userType === 'admin' && (
                <NotificationBell
                  notifications={notifications.slice(0, 10)}
                  unreadCount={unreadCount}
                  loading={notificationsLoading}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                />
              )}
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 rounded-full hover:bg-primary/10 transition-all">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-movello-blue-dark text-primary-foreground font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border-border/50 shadow-xl">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{getUserName()}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Status Message */}
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 sm:px-6 lg:px-8 pt-4"
          >
            <Alert variant={statusMessage.type === 'warning' ? 'default' : 'destructive'} className="border-primary/20 bg-primary/5">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <AlertDescription>{statusMessage.message}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Page Content */}
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

