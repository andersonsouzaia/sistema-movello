import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SkeletonTableProps {
  /**
   * Número de linhas a exibir
   */
  rows?: number
  /**
   * Número de colunas a exibir
   */
  columns?: number
  /**
   * Mostrar header da tabela
   */
  showHeader?: boolean
  /**
   * Mostrar card wrapper
   */
  showCard?: boolean
  /**
   * Classe CSS adicional
   */
  className?: string
}

/**
 * Componente Skeleton para tabelas
 * Usado nas páginas de listagem para mostrar loading state
 */
export function SkeletonTable({ 
  rows = 5, 
  columns = 4,
  showHeader = true,
  showCard = true,
  className
}: SkeletonTableProps) {
  const tableContent = (
    <div className={cn("space-y-4", className)}>
      {/* Header da tabela */}
      {showHeader && (
        <div className="flex gap-4 pb-2 border-b">
          {Array.from({ length: columns }).map((_, idx) => (
            <Skeleton 
              key={`header-${idx}`} 
              className="h-4 flex-1" 
            />
          ))}
        </div>
      )}
      
      {/* Linhas da tabela */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div 
          key={`row-${rowIdx}`} 
          className="flex gap-4 py-3"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton 
              key={`cell-${rowIdx}-${colIdx}`} 
              className={cn(
                "h-4 flex-1",
                // Primeira coluna pode ser mais larga (para nomes/títulos)
                colIdx === 0 && "flex-[2]",
                // Última coluna pode ser menor (para ações)
                colIdx === columns - 1 && "flex-[0.5]"
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  )

  if (showCard) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          {tableContent}
        </CardContent>
      </Card>
    )
  }

  return tableContent
}

/**
 * Skeleton específico para tabela de ganhos
 */
export function SkeletonGanhosTable({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-5 gap-4 pb-2 border-b">
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
          </div>
          
          {/* Rows */}
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-4 py-3">
              <Skeleton className="h-4 flex-[2]" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
