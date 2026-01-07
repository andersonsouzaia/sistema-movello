import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { useAuth } from '@/contexts/AuthContext'
import { useEmpresas } from '@/hooks/useEmpresas'
import { adminService } from '@/services/adminService'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { formatCNPJ } from '@/lib/utils/formatters'
import { formatDate } from '@/lib/utils/formatters'
import { CheckCircle2, XCircle, Ban, Eye } from 'lucide-react'
import { toast } from 'sonner'
import type { EmpresaStatus } from '@/types/database'

interface EmpresaRow {
  id: string
  razao_social: string
  cnpj: string
  status: EmpresaStatus
  created_at: string
  user_email: string
  user_nome: string
}

const statusConfig: Record<EmpresaStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  aguardando_aprovacao: { label: 'Aguardando Aprovação', variant: 'secondary' },
  ativa: { label: 'Ativa', variant: 'default' },
  bloqueada: { label: 'Bloqueada', variant: 'destructive' },
  suspensa: { label: 'Suspensa', variant: 'destructive' },
}

export default function AdminEmpresas() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const { empresas, loading, refetch } = useEmpresas({})

  const handleApprove = async (empresaId: string) => {
    if (!user?.id) return
    
    const result = await adminService.approveEmpresa({
      userId: empresaId,
      adminId: user.id,
    })

    if (result.success) {
      refetch()
    }
  }

  const handleBlock = async (empresaId: string) => {
    if (!user?.id) return
    
    const motivo = prompt('Informe o motivo do bloqueio:')
    if (!motivo) return

    const result = await adminService.blockEmpresa({
      userId: empresaId,
      adminId: user.id,
      motivo,
    })

    if (result.success) {
      refetch()
    }
  }

  const handleSuspend = async (empresaId: string) => {
    if (!user?.id) return
    
    const motivo = prompt('Informe o motivo da suspensão:')
    if (!motivo) return

    const result = await adminService.suspendEmpresa({
      userId: empresaId,
      adminId: user.id,
      motivo,
    })

    if (result.success) {
      refetch()
    }
  }

  const columns: Column<EmpresaRow>[] = [
    {
      key: 'razao_social',
      header: 'Razão Social',
      render: (row) => (
        <div>
          <div className="font-medium">{row.razao_social}</div>
          <div className="text-xs text-muted-foreground">{row.user_email}</div>
        </div>
      ),
    },
    {
      key: 'cnpj',
      header: 'CNPJ',
      render: (row) => <div>{formatCNPJ(row.cnpj)}</div>,
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/empresas/${row.id}`)}
            className="w-full sm:w-auto"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === 'aguardando_aprovacao' && (
            <RequirePermission permission="empresas.approve">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleApprove(row.id)}
                className="w-full sm:w-auto"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Aprovar
              </Button>
            </RequirePermission>
          )}
          {row.status === 'ativa' && (
            <RequirePermission permission="empresas.block">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBlock(row.id)}
                className="w-full sm:w-auto"
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
      <RequirePermission permission="empresas.read">
        <DashboardLayout>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                Empresas
              </h1>
              <p className="text-lg text-muted-foreground">
                Gerencie todas as empresas cadastradas
              </p>
            </motion.div>

            <DataTable
              data={empresas}
              columns={columns}
              searchKey="razao_social"
              searchPlaceholder="Buscar empresas por razão social, CNPJ ou email..."
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
              onRowClick={(row) => navigate(`/admin/empresas/${row.id}`)}
              emptyMessage="Nenhuma empresa encontrada"
            />
          </div>
        </DashboardLayout>
      </RequirePermission>
    </ProtectedRoute>
  )
}

