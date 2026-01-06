import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface CardSkeletonProps {
  showDescription?: boolean
}

export function CardSkeleton({ showDescription = true }: CardSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        {showDescription && <Skeleton className="h-4 w-48 mt-2" />}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  )
}

