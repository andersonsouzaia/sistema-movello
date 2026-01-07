import { CheckCircle2, Circle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StepIndicatorProps {
  steps: Array<{
    id: string
    title: string
    isComplete?: boolean
    isValid?: boolean
    isActive?: boolean
  }>
  currentStep: number
  onStepClick?: (stepIndex: number) => void
  allowNavigation?: boolean
  className?: string
}

export function StepIndicator({
  steps,
  currentStep,
  onStepClick,
  allowNavigation = true,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center justify-between relative", className)}>
      {/* Linha de conexão */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10" />
      <div
        className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-300 -z-10"
        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
      />

      {steps.map((step, index) => {
        const isActive = index === currentStep
        const isComplete = step.isComplete || (step.isValid && index < currentStep)
        const isAccessible = allowNavigation || index <= currentStep || step.isComplete
        const hasError = step.isValid === false

        return (
          <div
            key={step.id}
            className={cn(
              "flex flex-col items-center flex-1 relative",
              !isAccessible && "opacity-50"
            )}
          >
            <button
              type="button"
              onClick={() => isAccessible && onStepClick?.(index)}
              disabled={!isAccessible}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all relative z-10",
                isActive && "border-primary bg-primary text-primary-foreground shadow-lg scale-110",
                isComplete && !isActive && "border-primary bg-primary/10 text-primary",
                hasError && !isActive && "border-destructive bg-destructive/10 text-destructive",
                !isComplete && !hasError && !isActive && "border-muted bg-background text-muted-foreground",
                isAccessible && "cursor-pointer hover:scale-105",
                !isAccessible && "cursor-not-allowed"
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : hasError ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>
            <div className="mt-2 text-center max-w-[100px]">
              <p className={cn(
                "text-xs font-medium truncate",
                isActive && "text-primary",
                hasError && !isActive && "text-destructive",
                !isActive && !hasError && "text-muted-foreground"
              )}>
                {step.title}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}


