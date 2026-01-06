import { useState, ReactNode, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Save, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

export interface WizardStep {
  id: string
  title: string
  description?: string
  component: ReactNode
  isValid?: boolean
  isComplete?: boolean
  onValidate?: () => Promise<boolean> | boolean
}

interface CampaignWizardProps {
  steps: WizardStep[]
  currentStep: number
  onStepChange: (step: number) => void
  onFinish: () => void
  onSaveDraft?: () => void
  isLoading?: boolean
  className?: string
  allowFreeNavigation?: boolean
  previewComponent?: ReactNode
}

export function CampaignWizard({
  steps,
  currentStep,
  onStepChange,
  onFinish,
  onSaveDraft,
  isLoading = false,
  className,
  allowFreeNavigation = true,
  previewComponent,
}: CampaignWizardProps) {
  const [validatingStep, setValidatingStep] = useState<number | null>(null)
  const progress = ((currentStep + 1) / steps.length) * 100
  const currentStepData = steps[currentStep]
  const canGoNext = currentStepData.isValid !== false
  const canGoPrevious = currentStep > 0
  const isLastStep = currentStep === steps.length - 1

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return

      // Ctrl/Cmd + Arrow Right = Próximo
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault()
        if (canGoNext && !isLastStep) {
          handleNext()
        }
      }

      // Ctrl/Cmd + Arrow Left = Anterior
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault()
        if (canGoPrevious) {
          handlePrevious()
        }
      }

      // Esc = Voltar para lista (se implementado)
      if (e.key === 'Escape') {
        // Não fazer nada por enquanto
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, canGoNext, canGoPrevious, isLastStep, isLoading])

  const validateStep = useCallback(async (stepIndex: number): Promise<boolean> => {
    const step = steps[stepIndex]
    
    if (step.onValidate) {
      setValidatingStep(stepIndex)
      try {
        const isValid = await step.onValidate()
        return isValid
      } catch (error) {
        console.error('Erro ao validar etapa:', error)
        return false
      } finally {
        setValidatingStep(null)
      }
    }
    
    return step.isValid !== false
  }, [steps])

  const handleStepClick = useCallback(async (stepIndex: number) => {
    if (isLoading) return
    
    // Se navegação livre está desabilitada, só permitir avançar sequencialmente
    if (!allowFreeNavigation && stepIndex > currentStep) {
      return
    }

    // Se está tentando avançar para uma etapa futura, validar etapa atual primeiro
    if (stepIndex > currentStep) {
      const isValid = await validateStep(currentStep)
      if (!isValid) {
        return
      }
    }

    onStepChange(stepIndex)
  }, [currentStep, onStepChange, allowFreeNavigation, validateStep, isLoading])

  const handleNext = useCallback(async () => {
    if (isLoading) return
    
    // Validar etapa atual antes de avançar
    const isValid = await validateStep(currentStep)
    if (!isValid) {
      return
    }

    if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1)
    }
  }, [currentStep, steps.length, onStepChange, validateStep, isLoading])

  const handlePrevious = useCallback(() => {
    if (canGoPrevious && !isLoading) {
      onStepChange(currentStep - 1)
    }
  }, [canGoPrevious, currentStep, onStepChange, isLoading])

  const handleFinish = useCallback(async () => {
    if (isLoading) return
    
    // Validar etapa atual antes de finalizar
    const isValid = await validateStep(currentStep)
    if (!isValid) {
      return
    }

    onFinish()
  }, [currentStep, onFinish, validateStep, isLoading])

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Barra Lateral de Navegação */}
        <div className="lg:col-span-1">
          <Card className="card-premium sticky top-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Progresso</span>
                    <span className="text-muted-foreground">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-2">
                    {steps.map((step, index) => {
                      const isActive = index === currentStep
                      const isComplete = step.isComplete || (step.isValid && index < currentStep)
                      const isAccessible = allowFreeNavigation || index <= currentStep || step.isComplete
                      const isValidating = validatingStep === index

                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => handleStepClick(index)}
                          disabled={!isAccessible || isLoading || isValidating}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-all",
                            isActive && "border-primary bg-primary/5 shadow-sm",
                            isComplete && !isActive && "border-primary/30 bg-primary/5",
                            !isComplete && !isActive && "border-border bg-background",
                            isAccessible && !isLoading && "hover:bg-accent cursor-pointer",
                            (!isAccessible || isLoading) && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5",
                              isActive && "bg-primary text-primary-foreground",
                              isComplete && !isActive && "bg-primary/20 text-primary",
                              !isComplete && !isActive && "bg-muted text-muted-foreground"
                            )}>
                              {isValidating ? (
                                <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : isComplete ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <span className="text-xs font-medium">{index + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  "text-sm font-medium truncate",
                                  isActive && "text-primary",
                                  !isActive && "text-foreground"
                                )}>
                                  {step.title}
                                </p>
                                {isActive && (
                                  <Badge variant="secondary" className="text-xs">
                                    Atual
                                  </Badge>
                                )}
                              </div>
                              {step.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {step.description}
                                </p>
                              )}
                              {!isComplete && !isActive && step.isValid === false && (
                                <div className="flex items-center gap-1 mt-1">
                                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                                  <span className="text-xs text-yellow-600">
                                    Incompleto
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>

                {/* Dica de Atalhos */}
                <div className="pt-4 border-t text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Atalhos:</p>
                  <p>Ctrl + ← Anterior</p>
                  <p>Ctrl + → Próximo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo Principal */}
        <div className="lg:col-span-3 space-y-6">
          {/* Progress Bar Superior */}
          <Card className="card-premium">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-sm">
                    Etapa {currentStep + 1} de {steps.length}: {currentStepData.title}
                  </span>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Current Step Content */}
          <Card className="card-premium">
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Preview Component - apenas na primeira etapa */}
                {currentStep === 0 && previewComponent && (
                  <div className="mb-6">
                    {previewComponent}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
                    {currentStepData.description && (
                      <p className="text-muted-foreground mt-1">
                        {currentStepData.description}
                      </p>
                    )}
                  </div>

                  <div className="min-h-[400px]">
                    {currentStepData.component}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div>
              {onSaveDraft && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSaveDraft}
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Rascunho
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={!canGoPrevious || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              {isLastStep ? (
                <Button
                  type="button"
                  onClick={handleFinish}
                  disabled={!canGoNext || isLoading}
                >
                  {isLoading ? 'Criando...' : 'Criar Campanha'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoNext || isLoading}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
