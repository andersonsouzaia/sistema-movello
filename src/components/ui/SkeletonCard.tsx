import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SkeletonCardProps {
  /**
   * Mostrar ícone skeleton
   */
  showIcon?: boolean
  /**
   * Mostrar descrição skeleton
   */
  showDescription?: boolean
  /**
   * Classe CSS adicional
   */
  className?: string
}

/**
 * Componente Skeleton para cards de estatísticas
 * Usado no Dashboard para mostrar loading state dos cards
 */
export function SkeletonCard({ 
  showIcon = true, 
  showDescription = true,
  className 
}: SkeletonCardProps) {
  return (
    <Card className={cn("card-premium p-6", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <Skeleton className="h-4 w-24" />
        {showIcon && (
          <div className="w-12 h-12 rounded-2xl bg-muted">
            <Skeleton className="h-6 w-6 m-3" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        {showDescription && <Skeleton className="h-3 w-20" />}
      </CardContent>
    </Card>
  )
}

/**
 * Grid de SkeletonCards para múltiplos cards
 */
interface SkeletonCardGridProps {
  /**
   * Número de cards a exibir
   */
  count?: number
  /**
   * Mostrar ícone nos cards
   */
  showIcon?: boolean
  /**
   * Mostrar descrição nos cards
   */
  showDescription?: boolean
}

export function SkeletonCardGrid({ 
  count = 4, 
  showIcon = true,
  showDescription = true 
}: SkeletonCardGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard 
          key={index}
          showIcon={showIcon}
          showDescription={showDescription}
        />
      ))}
    </div>
  )
}
