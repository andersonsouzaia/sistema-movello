import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp } from 'lucide-react'
import type { KPIsMeta, ObjetivoPrincipal } from '@/types/database'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'

interface KPIsEditorProps {
  value?: KPIsMeta
  objetivoPrincipal?: ObjetivoPrincipal
  orcamento?: number
  onChange: (kpis: KPIsMeta) => void
  className?: string
  disabled?: boolean
}

const SUGESTOES_POR_OBJETIVO: Record<ObjetivoPrincipal, Partial<KPIsMeta>> = {
  awareness: {
    visualizacoes: 10000,
    cliques: 500,
    ctr: 5,
  },
  consideracao: {
    visualizacoes: 15000,
    cliques: 1500,
    ctr: 10,
  },
  conversao: {
    visualizacoes: 20000,
    cliques: 2000,
    conversoes: 200,
    ctr: 10,
    cpc: 0.5,
  },
  retencao: {
    visualizacoes: 10000,
    cliques: 1000,
    conversoes: 500,
    ctr: 10,
  },
  engajamento: {
    visualizacoes: 15000,
    cliques: 3000,
    ctr: 20,
  },
}

export function KPIsEditor({
  value,
  objetivoPrincipal,
  orcamento,
  onChange,
  className,
  disabled = false,
}: KPIsEditorProps) {
  const [kpis, setKpis] = useState<KPIsMeta>(value || {})

  useEffect(() => {
    if (value) {
      setKpis(value)
    }
  }, [value])

  const handleKPIChange = (campo: keyof KPIsMeta, valor: string) => {
    const numero = parseFloat(valor) || 0
    const novosKpis = { ...kpis, [campo]: numero }
    setKpis(novosKpis)
    onChange(novosKpis)
  }

  const handleAplicarSugestao = () => {
    if (!objetivoPrincipal) return
    
    const sugestao = SUGESTOES_POR_OBJETIVO[objetivoPrincipal]
    const novosKpis = { ...kpis, ...sugestao }
    setKpis(novosKpis)
    onChange(novosKpis)
  }

  const calcularCTR = () => {
    if (kpis.visualizacoes && kpis.cliques) {
      return ((kpis.cliques / kpis.visualizacoes) * 100).toFixed(2)
    }
    return kpis.ctr?.toFixed(2) || '0.00'
  }

  const calcularCPC = () => {
    if (orcamento && kpis.cliques) {
      return (orcamento / kpis.cliques).toFixed(2)
    }
    return kpis.cpc?.toFixed(2) || '0.00'
  }

  return (
    <Card className={cn("card-premium", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Metas de KPIs
        </CardTitle>
        <CardDescription>
          Defina as metas de performance para sua campanha
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sugestão baseada no objetivo */}
        {objetivoPrincipal && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sugestões baseadas no objetivo</p>
                <p className="text-xs text-muted-foreground">
                  Clique para aplicar valores sugeridos
                </p>
              </div>
              <button
                type="button"
                onClick={handleAplicarSugestao}
                disabled={disabled}
                className="text-sm text-primary hover:underline"
              >
                Aplicar Sugestão
              </button>
            </div>
          </div>
        )}

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="visualizacoes">Visualizações</Label>
            <Input
              id="visualizacoes"
              type="number"
              value={kpis.visualizacoes || ''}
              onChange={(e) => handleKPIChange('visualizacoes', e.target.value)}
              placeholder="10000"
              min={0}
              disabled={disabled}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Número total de visualizações esperadas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliques">Cliques</Label>
            <Input
              id="cliques"
              type="number"
              value={kpis.cliques || ''}
              onChange={(e) => handleKPIChange('cliques', e.target.value)}
              placeholder="500"
              min={0}
              disabled={disabled}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Número total de cliques esperados
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversoes">Conversões</Label>
            <Input
              id="conversoes"
              type="number"
              value={kpis.conversoes || ''}
              onChange={(e) => handleKPIChange('conversoes', e.target.value)}
              placeholder="50"
              min={0}
              disabled={disabled}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Número de conversões esperadas (vendas/leads)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ctr">CTR (%)</Label>
            <Input
              id="ctr"
              type="number"
              step="0.01"
              value={kpis.ctr || calcularCTR()}
              onChange={(e) => handleKPIChange('ctr', e.target.value)}
              placeholder="5.00"
              min={0}
              max={100}
              disabled={disabled}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Taxa de clique (calculada automaticamente)
            </p>
          </div>
        </div>

        {/* KPIs Calculados */}
        <div className="pt-4 border-t">
          <Label className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4" />
            Métricas Calculadas
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">CTR</p>
              <p className="text-lg font-semibold">{calcularCTR()}%</p>
            </div>
            {orcamento && kpis.cliques && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">CPC Estimado</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(parseFloat(calcularCPC()))}
                </p>
              </div>
            )}
            {kpis.visualizacoes && kpis.conversoes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
                <p className="text-lg font-semibold">
                  {((kpis.conversoes / kpis.visualizacoes) * 100).toFixed(2)}%
                </p>
              </div>
            )}
            {orcamento && kpis.conversoes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">CPA Estimado</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(orcamento / kpis.conversoes)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Validações */}
        {kpis.visualizacoes && kpis.cliques && kpis.cliques > kpis.visualizacoes && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-600">
              Atenção: O número de cliques não pode ser maior que o de visualizações
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

