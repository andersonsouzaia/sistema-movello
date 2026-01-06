import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorDisplayProps {
  title?: string
  message: string
  onRetry?: () => void
  retryText?: string
  className?: string
}

export function ErrorDisplay({
  title = 'Erro ao carregar dados',
  message,
  onRetry,
  retryText = 'Tentar novamente',
  className,
}: ErrorDisplayProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span>{message}</span>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              {retryText}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

