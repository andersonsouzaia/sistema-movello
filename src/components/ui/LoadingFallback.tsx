import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingFallbackProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingFallback({ 
  message = 'Carregando...', 
  className,
  size = 'md'
}: LoadingFallbackProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div className={cn(
      "flex items-center justify-center p-8 border border-border rounded-lg bg-muted/50",
      className
    )}>
      <Loader2 className={cn("animate-spin text-primary mr-2", sizeClasses[size])} />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  )
}


