import { ReactNode } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Check, X, Ban, Pause, Play, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ActionType =
  | 'approve'
  | 'reject'
  | 'block'
  | 'unblock'
  | 'pause'
  | 'resume'
  | 'edit'
  | 'delete'
  | 'view'

interface ActionButtonProps extends Omit<ButtonProps, 'onClick'> {
  action: ActionType | ActionType[]
  onAction: (action: ActionType) => void
  label?: string
  icon?: ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

const actionConfig: Record<
  ActionType,
  { label: string; icon: ReactNode; variant?: ButtonProps['variant'] }
> = {
  approve: { label: 'Aprovar', icon: <Check className="h-4 w-4" />, variant: 'default' },
  reject: { label: 'Rejeitar', icon: <X className="h-4 w-4" />, variant: 'destructive' },
  block: { label: 'Bloquear', icon: <Ban className="h-4 w-4" />, variant: 'destructive' },
  unblock: { label: 'Desbloquear', icon: <Check className="h-4 w-4" />, variant: 'default' },
  pause: { label: 'Pausar', icon: <Pause className="h-4 w-4" />, variant: 'outline' },
  resume: { label: 'Retomar', icon: <Play className="h-4 w-4" />, variant: 'default' },
  edit: { label: 'Editar', icon: <Edit className="h-4 w-4" />, variant: 'outline' },
  delete: { label: 'Excluir', icon: <Trash2 className="h-4 w-4" />, variant: 'destructive' },
  view: { label: 'Ver', icon: <MoreVertical className="h-4 w-4" />, variant: 'ghost' },
}

export function ActionButton({
  action,
  onAction,
  label,
  icon,
  variant,
  className,
  ...props
}: ActionButtonProps) {
  const actions = Array.isArray(action) ? action : [action]

  // Se apenas uma ação, mostrar botão simples
  if (actions.length === 1) {
    const singleAction = actions[0]
    const config = actionConfig[singleAction]

    return (
      <Button
        variant={variant || config.variant || 'default'}
        onClick={() => onAction(singleAction)}
        className={cn('gap-2', className)}
        {...props}
      >
        {icon || config.icon}
        {label || config.label}
      </Button>
    )
  }

  // Múltiplas ações, mostrar dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn('gap-2', className)} {...props}>
          <MoreVertical className="h-4 w-4" />
          {label || 'Ações'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((act) => {
          const config = actionConfig[act]
          return (
            <DropdownMenuItem
              key={act}
              onClick={() => onAction(act)}
              className={cn(
                'gap-2',
                config.variant === 'destructive' && 'text-destructive focus:text-destructive'
              )}
            >
              {config.icon}
              {config.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

