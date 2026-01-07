import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/formatters'
import type { CampanhaMetricasConsolidadas, KPIsMeta } from '@/types/database'

interface InsightsWidgetProps {
  metricas?: CampanhaMetricasConsolidadas | null
  kpisMeta?: KPIsMeta
  className?: string
}

interface Insight {
  tipo: 'success' | 'warning' | 'error' | 'info'
  titulo: string
  descricao: string
  acao?: string
}

export function InsightsWidget({
  metricas,
  kpisMeta,
  className,
}: InsightsWidgetProps) {
  const insights = useMemo(() => {
    if (!metricas) return []

    const lista: Insight[] = []

    // Verificar CTR
    if (metricas.ctr > 0) {
      if (kpisMeta?.ctr && metricas.ctr < kpisMeta.ctr) {
        lista.push({
          tipo: 'warning',
          titulo: 'CTR abaixo da meta',
          descricao: `Seu CTR atual é ${metricas.ctr.toFixed(2)}%, mas sua meta é ${kpisMeta.ctr}%. Considere melhorar o título ou imagem da campanha.`,
          acao: 'Otimizar campanha',
        })
      } else if (metricas.ctr > 2) {
        lista.push({
          tipo: 'success',
          titulo: 'CTR excelente',
          descricao: `Seu CTR de ${metricas.ctr.toFixed(2)}% está acima da média. Continue assim!`,
        })
      }
    }

    // Verificar CPC
    if (metricas.cpc > 0) {
      if (kpisMeta?.cpc && metricas.cpc > kpisMeta.cpc) {
        lista.push({
          tipo: 'warning',
          titulo: 'CPC acima da meta',
          descricao: `Seu CPC atual é ${formatCurrency(metricas.cpc)}, mas sua meta é ${formatCurrency(kpisMeta.cpc)}. Considere ajustar o público-alvo ou horários de exibição.`,
          acao: 'Ajustar segmentação',
        })
      }
    }

    // Verificar taxa de conversão
    if (metricas.taxa_conversao > 0) {
      if (metricas.taxa_conversao < 1) {
        lista.push({
          tipo: 'warning',
          titulo: 'Taxa de conversão baixa',
          descricao: `Sua taxa de conversão é ${metricas.taxa_conversao.toFixed(2)}%. Considere revisar o público-alvo ou a mensagem da campanha.`,
          acao: 'Revisar campanha',
        })
      } else if (metricas.taxa_conversao > 5) {
        lista.push({
          tipo: 'success',
          titulo: 'Taxa de conversão excelente',
          descricao: `Sua taxa de conversão de ${metricas.taxa_conversao.toFixed(2)}% está muito boa!`,
        })
      }
    }

    // Verificar CPA
    if (metricas.cpa > 0 && kpisMeta?.cpc) {
      // Se CPA é muito maior que CPC, pode indicar problema
      if (metricas.cpa > metricas.cpc * 10) {
        lista.push({
          tipo: 'error',
          titulo: 'CPA muito alto',
          descricao: `Seu CPA de ${formatCurrency(metricas.cpa)} está muito alto comparado ao CPC. Considere otimizar o funil de conversão.`,
          acao: 'Otimizar conversão',
        })
      }
    }

    // Verificar se não há métricas suficientes
    if (metricas.total_visualizacoes === 0) {
      lista.push({
        tipo: 'info',
        titulo: 'Sem dados ainda',
        descricao: 'Suas campanhas ainda não têm métricas suficientes. Aguarde alguns dias para receber insights.',
      })
    }

    // Verificar se há muitas visualizações mas poucos cliques
    if (metricas.total_visualizacoes > 1000 && metricas.total_cliques < 10) {
      lista.push({
        tipo: 'warning',
        titulo: 'Muitas visualizações, poucos cliques',
        descricao: 'Você tem muitas visualizações mas poucos cliques. Considere melhorar o call-to-action ou a imagem da campanha.',
        acao: 'Melhorar CTA',
      })
    }

    return lista.slice(0, 5) // Limitar a 5 insights
  }, [metricas, kpisMeta])

  if (insights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Insights
          </CardTitle>
          <CardDescription>Recomendações e alertas automáticos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Tudo está funcionando bem! Não há insights no momento.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Insights
        </CardTitle>
        <CardDescription>Recomendações e alertas automáticos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <Alert
              key={index}
              className={cn(
                'border-l-4',
                insight.tipo === 'success' && 'border-green-500 bg-green-50 dark:bg-green-950',
                insight.tipo === 'warning' && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
                insight.tipo === 'error' && 'border-red-500 bg-red-50 dark:bg-red-950',
                insight.tipo === 'info' && 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              )}
            >
              <div className="flex items-start gap-3">
                {insight.tipo === 'success' && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                )}
                {insight.tipo === 'warning' && (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                )}
                {insight.tipo === 'error' && (
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                {insight.tipo === 'info' && (
                  <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{insight.titulo}</h4>
                  <AlertDescription>{insight.descricao}</AlertDescription>
                  {insight.acao && (
                    <div className="mt-2">
                      <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                        {insight.acao}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


