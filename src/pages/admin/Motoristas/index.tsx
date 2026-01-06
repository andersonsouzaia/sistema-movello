import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { useAuth } from '@/contexts/AuthContext'
import { useMotoristas } from '@/hooks/useMotoristas'
import { adminService } from '@/services/adminService'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { formatCPF } from '@/lib/utils/formatters'
import { formatDate } from '@/lib/utils/formatters'
import { CheckCircle2, Ban, Eye } from 'lucide-react'
import type { MotoristaStatus } from '@/types/database'

interface MotoristaRow {
  id: string
  nome: string
  cpf: string
  status: MotoristaStatus
  created_at: string
  user_email: string
  user_nome: string
  veiculo: string
}

const statusConfig: Record<MotoristaStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  aguardando_aprovacao: { label: 'Aguardando Aprovação', variant: 'secondary' },
  aprovado: { label: 'Aprovado', variant: 'default' },
  bloqueado: { label: 'Bloqueado', variant: 'destructive' },
  suspenso: { label: 'Suspenso', variant: 'destructive' },
}

export default function AdminMotoristas() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const { motoristas, loading, refetch } = useMotoristas({})

  const handleApprove = async (motoristaId: string) => {
    if (!user?.id) return
    
    const result = await adminService.approveMotorista({
      userId: motoristaId,
      adminId: user.id,
    })

    if (result.success) {
      refetch()
    }
  }

  const handleBlock = async (motoristaId: string) => {
    if (!user?.id) return
    
    const motivo = prompt('Informe o motivo do bloqueio:')
    if (!motivo) return

    const result = await adminService.blockMotorista({
      userId: motoristaId,
      adminId: user.id,
      motivo,
    })

    if (result.success) {
      refetch()
    }
  }

  const handleSuspend = async (motoristaId: string) => {
    if (!user?.id) return
    
    const motivo = prompt('Informe o motivo da suspensão:')
    if (!motivo) return

    const result = await adminService.suspendMotorista({
      userId: motoristaId,
      adminId: user.id,
      motivo,
    })

    if (result.success) {
      refetch()
    }
  }

  const columns: Column<MotoristaRow>[] = [
    {
      key: 'nome',
      header: 'Nome',
      render: (row) => (
        <div>
          <div className="font-medium">{row.user_nome || 'Motorista'}</div>
          <div className="text-xs text-muted-foreground">{row.user_email}</div>
        </div>
      ),
    },
    {
      key: 'cpf',
      header: 'CPF',
      render: (row) => <div>{formatCPF(row.cpf)}</div>,
    },
    {
      key: 'veiculo',
      header: 'Veículo',
      render: (row) => <div className="text-sm">{row.veiculo}</div>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const config = statusConfig[row.status]
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/motoristas/${row.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === 'aguardando_aprovacao' && (
            <RequirePermission permission="motoristas.approve">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleApprove(row.id)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Aprovar
              </Button>
            </RequirePermission>
          )}
          {row.status === 'aprovado' && (
            <RequirePermission permission="motoristas.block">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBlock(row.id)}
              >
                <Ban className="h-4 w-4 mr-1" />
                Bloquear
              </Button>
            </RequirePermission>
          )}
        </div>
      ),
    },
  ]

  return (
    <ProtectedRoute requiredUserType="admin">
      <RequirePermission permission="motoristas.read">
        <DashboardLayout>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                Motoristas
              </h1>
              <p className="text-lg text-muted-foreground">
                Gerencie todos os motoristas cadastrados
              </p>
            </motion.div>

            <DataTable
              data={motoristas}
              columns={columns}
              searchKey="user_nome"
              searchPlaceholder="Buscar motoristas por nome, CPF ou email..."
              loading={loading}
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
              onRowClick={(row) => navigate(`/admin/motoristas/${row.id}`)}
              emptyMessage="Nenhum motorista encontrado"
            />
          </div>
        </DashboardLayout>
      </RequirePermission>
    </ProtectedRoute>
  )
}

