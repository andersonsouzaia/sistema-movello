import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export interface ValidationMessage {
  type: 'error' | 'warning' | 'info' | 'success'
  message: string
  suggestion?: string
  field?: string
}

interface ValidationFeedbackProps {
  messages: ValidationMessage[]
  className?: string
}

export function ValidationFeedback({ messages, className }: ValidationFeedbackProps) {
  if (messages.length === 0) return null

  return (
    <div className={cn("space-y-2", className)}>
      {messages.map((msg, index) => {
        const Icon = {
          error: AlertCircle,
          warning: AlertTriangle,
          info: Info,
          success: CheckCircle2,
        }[msg.type]

        const variant = {
          error: 'destructive',
          warning: 'default',
          info: 'default',
          success: 'default',
        }[msg.type] as 'default' | 'destructive'

        return (
          <Alert key={index} variant={variant} className={cn(
            msg.type === 'error' && 'border-destructive',
            msg.type === 'warning' && 'border-yellow-500/50 bg-yellow-500/5',
            msg.type === 'info' && 'border-blue-500/50 bg-blue-500/5',
            msg.type === 'success' && 'border-green-500/50 bg-green-500/5'
          )}>
            <Icon className={cn(
              "h-4 w-4",
              msg.type === 'error' && 'text-destructive',
              msg.type === 'warning' && 'text-yellow-600',
              msg.type === 'info' && 'text-blue-600',
              msg.type === 'success' && 'text-green-600'
            )} />
            <AlertTitle className="text-sm font-medium">
              {msg.type === 'error' && 'Erro'}
              {msg.type === 'warning' && 'Atenção'}
              {msg.type === 'info' && 'Informação'}
              {msg.type === 'success' && 'Sucesso'}
            </AlertTitle>
            <AlertDescription className="text-sm">
              {msg.message}
              {msg.suggestion && (
                <div className="mt-1 text-xs text-muted-foreground">
                  <strong>Sugestão:</strong> {msg.suggestion}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )
      })}
    </div>
  )
}

interface FieldValidationFeedbackProps {
  error?: string
  warning?: string
  info?: string
  success?: string
  className?: string
}

export function FieldValidationFeedback({
  error,
  warning,
  info,
  success,
  className,
}: FieldValidationFeedbackProps) {
  if (!error && !warning && !info && !success) return null

  const messages: ValidationMessage[] = []
  if (error) messages.push({ type: 'error', message: error })
  if (warning) messages.push({ type: 'warning', message: warning })
  if (info) messages.push({ type: 'info', message: info })
  if (success) messages.push({ type: 'success', message: success })

  return <ValidationFeedback messages={messages} className={className} />
}


