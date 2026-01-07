import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Lightbulb,
  Target
} from 'lucide-react'
import { 
  calcularSugestoesOrcamento, 
  simularROI, 
  verificarOrcamentoSuficiente,
  otimizarOrcamento,
  type ROISimulation
} from '@/utils/budgetCalculator'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import type { ObjetivoPrincipal } from '@/types/database'

interface BudgetCalculatorProps {
  areaKm2: number
  duracaoDias: number
  objetivo: ObjetivoPrincipal
  orcamentoAtual?: number
  alcanceEstimado?: number
  onOrcamentoChange?: (orcamento: number) => void
  className?: string
}

export function BudgetCalculator({
  areaKm2,
  duracaoDias,
  objetivo,
  orcamentoAtual = 0,
  alcanceEstimado,
  onOrcamentoChange,
  className,
}: BudgetCalculatorProps) {
  const [metaROI, setMetaROI] = useState(100)
  const [valorConversaoMedio, setValorConversaoMedio] = useState(50)

  const sugestoes = useMemo(() => {
    return calcularSugestoesOrcamento(areaKm2, objetivo, duracaoDias)
  }, [areaKm2, objetivo, duracaoDias])

  const verificacao = useMemo(() => {
    if (orcamentoAtual <= 0) return null
    return verificarOrcamentoSuficiente(orcamentoAtual, areaKm2, duracaoDias, objetivo)
  }, [orcamentoAtual, areaKm2, duracaoDias, objetivo])

  const simulacaoROI = useMemo(() => {
    if (!orcamentoAtual || orcamentoAtual <= 0 || !alcanceEstimado) return null
    return simularROI(orcamentoAtual, alcanceEstimado, objetivo, 0.02, valorConversaoMedio)
  }, [orcamentoAtual, alcanceEstimado, objetivo, valorConversaoMedio])

  const otimizacao = useMemo(() => {
    if (orcamentoAtual <= 0) return null
    return otimizarOrcamento(orcamentoAtual, areaKm2, duracaoDias, objetivo, metaROI)
  }, [orcamentoAtual, areaKm2, duracaoDias, objetivo, metaROI])

  const handleSugestaoClick = (orcamento: number) => {
    onOrcamentoChange?.(orcamento)
  }

  if (areaKm2 === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculadora de Orçamento
          </CardTitle>
          <CardDescription>
            Configure a localização para ver sugestões de orçamento
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Calculadora de Orçamento
        </CardTitle>
        <CardDescription>
          Sugestões baseadas em área de cobertura e objetivo da campanha
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sugestões de Orçamento */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Sugestões de Orçamento</Label>
          <div className="grid gap-2">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
              <div>
                <p className="text-sm font-medium">Mínimo</p>
                <p className="text-xs text-muted-foreground">Resultados básicos</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {formatCurrency(sugestoes.orcamentoMinimo)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSugestaoClick(sugestoes.orcamentoMinimo)}
                >
                  Usar
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-primary bg-primary/5">
              <div>
                <p className="text-sm font-medium">Recomendado</p>
                <p className="text-xs text-muted-foreground">Melhor custo-benefício</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(sugestoes.orcamentoRecomendado)}
                </span>
                <Button
                  size="sm"
                  onClick={() => handleSugestaoClick(sugestoes.orcamentoRecomendado)}
                >
                  Usar
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
              <div>
                <p className="text-sm font-medium">Otimizado</p>
                <p className="text-xs text-muted-foreground">Máximo alcance</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {formatCurrency(sugestoes.orcamentoOtimizado)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSugestaoClick(sugestoes.orcamentoOtimizado)}
                >
                  Usar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Verificação de Orçamento Atual */}
        {verificacao && (
          <Alert className={cn(
            verificacao.suficiente 
              ? "border-green-500/50 bg-green-500/5" 
              : "border-yellow-500/50 bg-yellow-500/5"
          )}>
            {verificacao.suficiente ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription className="text-sm">
              {verificacao.mensagem}
              {!verificacao.suficiente && (
                <div className="mt-1">
                  <p className="text-xs text-muted-foreground">
                    Faltam {formatCurrency(verificacao.diferenca)} para o mínimo recomendado
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Simulador de ROI */}
        {simulacaoROI && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Simulador de ROI
            </Label>
            <div className="p-3 rounded-lg border border-border bg-muted/50">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Investimento</p>
                  <p className="font-semibold">{formatCurrency(simulacaoROI.investimento)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Conversões Estimadas</p>
                  <p className="font-semibold">{simulacaoROI.conversoesEstimadas}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Receita Estimada</p>
                  <p className="font-semibold">{formatCurrency(simulacaoROI.receitaEstimada)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ROI</p>
                  <p className={cn(
                    "font-semibold",
                    simulacaoROI.roiPercentual >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {simulacaoROI.roiPercentual >= 0 ? '+' : ''}{simulacaoROI.roiPercentual.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="valor-conversao" className="text-xs text-muted-foreground">
                Valor médio por conversão (R$):
              </Label>
              <Input
                id="valor-conversao"
                type="number"
                value={valorConversaoMedio}
                onChange={(e) => setValorConversaoMedio(Number(e.target.value))}
                className="h-8 w-24"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        )}

        {/* Otimização */}
        {otimizacao && orcamentoAtual > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Sugestão de Otimização
            </Label>
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-sm mb-2">{otimizacao.razao}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Orçamento Otimizado</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatCurrency(otimizacao.orcamentoOtimizado)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSugestaoClick(otimizacao.orcamentoOtimizado)}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Informação */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          <p>
            <strong>Nota:</strong> {sugestoes.razao}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}


