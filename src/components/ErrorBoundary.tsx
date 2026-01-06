import { Component, ReactNode, ErrorInfo } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo)
    // Aqui você pode enviar o erro para um serviço de monitoramento
    // Ex: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Ops! Algo deu errado
              </h1>
              <p className="text-muted-foreground">
                Ocorreu um erro inesperado. Por favor, tente novamente.
              </p>
            </div>

            {this.state.error && process.env.NODE_ENV === 'development' && (
              <div className="text-left bg-muted p-4 rounded-lg">
                <p className="text-sm font-mono text-destructive">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-xs mt-2 overflow-auto">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button onClick={this.handleReset} variant="default">
                Voltar ao Início
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Recarregar Página
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

