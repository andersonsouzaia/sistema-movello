
import { useNavigate } from 'react-router-dom'
import { LogOut, User, LayoutDashboard } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

interface UserMenuProps {
    className?: string
    align?: 'start' | 'end' | 'center'
}

export function UserMenu({ className, align = 'end' }: UserMenuProps) {
    const { user, profile, empresa, signOut, userType } = useAuth()
    const navigate = useNavigate()

    const handleSignOut = async () => {
        await signOut()
        navigate('/')
    }

    const handleDashboard = () => {
        if (userType) {
            navigate(`/${userType}/dashboard`)
        } else if (profile?.tipo) {
            navigate(`/${profile.tipo}/dashboard`)
        } else {
            // Fallback: tentar identificar pelo metadado ou recarregar
            console.warn('UserType não encontrado, tentando redirecionar para default...')
            // Tenta empresa como padrão ou reload
            window.location.href = '/empresa/dashboard'
        }
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

    if (!user) return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("relative h-10 w-10 rounded-full hover:bg-primary/10 transition-all", className)}>
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-movello-blue-dark text-primary-foreground font-semibold">
                            {getUserInitials()}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-56 bg-card/95 backdrop-blur-xl border-border/50 shadow-xl">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{getUserName()}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDashboard} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
