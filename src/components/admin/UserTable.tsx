import { DataTable, Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, KeyRound, Ban } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'
import type { UserWithRoles, RoleSlug } from '@/types/database'

interface UserTableProps {
  users: UserWithRoles[]
  loading?: boolean
  onEditRole?: (userId: string) => void
  onResetPassword?: (userId: string) => void
  onBlock?: (userId: string) => void
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  ativo: { label: 'Ativo', variant: 'default' },
  inativo: { label: 'Inativo', variant: 'secondary' },
  bloqueado: { label: 'Bloqueado', variant: 'destructive' },
  suspenso: { label: 'Suspenso', variant: 'destructive' },
}

export function UserTable({ users, loading, onEditRole, onResetPassword, onBlock }: UserTableProps) {
  const columns: Column<UserWithRoles>[] = [
    {
      key: 'nome',
      header: 'Nome',
      render: (row) => (
        <div>
          <div className="font-medium">{row.nome || 'Sem nome'}</div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.map((role) => (
            <Badge key={role.id} variant={role.is_system ? 'default' : 'secondary'}>
              {role.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const config = statusConfig[row.status] || { label: row.status, variant: 'default' as const }
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      key: 'created_at',
      header: 'Data de Cadastro',
      render: (row) => <div className="text-sm">{formatDate(row.created_at)}</div>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEditRole && (
              <DropdownMenuItem onClick={() => onEditRole(row.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar Role
              </DropdownMenuItem>
            )}
            {onResetPassword && (
              <DropdownMenuItem onClick={() => onResetPassword(row.id)}>
                <KeyRound className="mr-2 h-4 w-4" />
                Resetar Senha
              </DropdownMenuItem>
            )}
            {onBlock && row.status === 'ativo' && (
              <DropdownMenuItem onClick={() => onBlock(row.id)} className="text-destructive">
                <Ban className="mr-2 h-4 w-4" />
                Bloquear
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <DataTable
      data={users}
      columns={columns}
      searchKey="nome"
      searchPlaceholder="Buscar usuários por nome ou email..."
      loading={loading}
      emptyMessage="Nenhum usuário encontrado"
      filters={[
        {
          key: 'status',
          label: 'Status',
          options: Object.entries(statusConfig).map(([value, config]) => ({
            value,
            label: config.label,
          })),
        },
      ]}
    />
  )
}

