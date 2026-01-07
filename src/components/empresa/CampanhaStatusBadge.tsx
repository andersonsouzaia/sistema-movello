import { Badge } from '@/components/ui/badge'
import type { CampanhaStatus } from '@/types/database'

const statusConfig: Record<CampanhaStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  em_analise: { label: 'Em Análise', variant: 'secondary' },
  aprovada: { label: 'Aprovada', variant: 'default' },
  reprovada: { label: 'Reprovada', variant: 'destructive' },
  ativa: { label: 'Ativa', variant: 'default' },
  pausada: { label: 'Pausada', variant: 'secondary' },
  finalizada: { label: 'Finalizada', variant: 'secondary' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
}

interface CampanhaStatusBadgeProps {
  status: CampanhaStatus
  className?: string
}

export function CampanhaStatusBadge({ status, className }: CampanhaStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'secondary' as const }
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}


