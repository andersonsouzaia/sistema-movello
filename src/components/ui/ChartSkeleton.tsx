import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ChartSkeletonProps {
  showTitle?: boolean
  height?: number
}

export function ChartSkeleton({ showTitle = true, height = 300 }: ChartSkeletonProps) {
  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
      )}
      <CardContent>
        <Skeleton className="w-full" style={{ height: `${height}px` }} />
      </CardContent>
    </Card>
  )
}

