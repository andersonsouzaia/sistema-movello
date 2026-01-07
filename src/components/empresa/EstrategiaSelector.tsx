import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, MousePointerClick, Eye, ShoppingCart, UserPlus } from 'lucide-react'
import type { Estrategia, ObjetivoPrincipal } from '@/types/database'
import { cn } from '@/lib/utils'

interface EstrategiaInfo {
  value: Estrategia
  nome: string
  descricao: string
  icone: any
  quandoUsar: string
  objetivosRecomendados: ObjetivoPrincipal[]
}

const ESTRATEGIAS: EstrategiaInfo[] = [
  {
    value: 'cpc',
    nome: 'CPC - Custo por Clique',
    descricao: 'Você paga apenas quando alguém clica no seu anúncio',
    icone: MousePointerClick,
    quandoUsar: 'Ideal para campanhas focadas em tráfego e engajamento',
    objetivosRecomendados: ['consideracao', 'engajamento'],
  },
  {
    value: 'cpm',
    nome: 'CPM - Custo por Mil Impressões',
    descricao: 'Você paga por cada mil visualizações do seu anúncio',
    icone: Eye,
    quandoUsar: 'Ideal para aumentar alcance e conscientização de marca',
    objetivosRecomendados: ['awareness'],
  },
  {
    value: 'cpa',
    nome: 'CPA - Custo por Aquisição',
    descricao: 'Você paga apenas quando há uma conversão (venda/lead)',
    icone: ShoppingCart,
    quandoUsar: 'Ideal para campanhas focadas em resultados e ROI',
    objetivosRecomendados: ['conversao'],
  },
  {
    value: 'cpl',
    nome: 'CPL - Custo por Lead',
    descricao: 'Você paga por cada lead gerado (formulário preenchido, etc)',
    icone: UserPlus,
    quandoUsar: 'Ideal para captação de leads qualificados',
    objetivosRecomendados: ['conversao', 'retencao'],
  },
]

interface EstrategiaSelectorProps {
  value?: Estrategia
  objetivoPrincipal?: ObjetivoPrincipal
  onChange: (estrategia: Estrategia) => void
  className?: string
  disabled?: boolean
}

export function EstrategiaSelector({
  value,
  objetivoPrincipal,
  onChange,
  className,
  disabled = false,
}: EstrategiaSelectorProps) {
  const [estrategiaSelecionada, setEstrategiaSelecionada] = useState<Estrategia | undefined>(value)

  useEffect(() => {
    setEstrategiaSelecionada(value)
  }, [value])

  const estrategiasRecomendadas = objetivoPrincipal
    ? ESTRATEGIAS.filter((e) => e.objetivosRecomendados.includes(objetivoPrincipal))
    : ESTRATEGIAS

  const handleEstrategiaClick = (estrategia: Estrategia) => {
    if (!disabled) {
      setEstrategiaSelecionada(estrategia)
      onChange(estrategia)
    }
  }

  return (
    <Card className={cn("card-premium", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Estratégia de Veiculação
        </CardTitle>
        <CardDescription>
          Escolha como você deseja pagar pela veiculação da campanha
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recomendações */}
        {objetivoPrincipal && estrategiasRecomendadas.length < ESTRATEGIAS.length && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-medium mb-1">Recomendado para seu objetivo</p>
            <div className="flex flex-wrap gap-2">
              {estrategiasRecomendadas.map((estrategia) => (
                <Badge key={estrategia.value} variant="default">
                  {estrategia.nome}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Grid de Estratégias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ESTRATEGIAS.map((estrategia) => {
            const Icon = estrategia.icone
            const selecionada = estrategiaSelecionada === estrategia.value
            const recomendada = objetivoPrincipal
              ? estrategia.objetivosRecomendados.includes(objetivoPrincipal)
              : false

            return (
              <button
                key={estrategia.value}
                type="button"
                onClick={() => handleEstrategiaClick(estrategia.value)}
                disabled={disabled}
                className={cn(
                  "p-4 border-2 rounded-lg text-left transition-all",
                  "hover:border-primary hover:shadow-md",
                  selecionada
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-muted",
                  recomendada && !selecionada && "border-primary/50 bg-primary/5",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn(
                    "h-6 w-6 mt-1",
                    selecionada ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn(
                        "font-medium",
                        selecionada && "text-primary"
                      )}>
                        {estrategia.nome}
                      </p>
                      {recomendada && (
                        <Badge variant="secondary" className="text-xs">
                          Recomendado
                        </Badge>
                      )}
                      {selecionada && (
                        <Badge variant="default" className="text-xs">
                          Selecionada
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {estrategia.descricao}
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      {estrategia.quandoUsar}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Explicação */}
        {estrategiaSelecionada && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Como funciona</p>
            <p className="text-sm text-muted-foreground">
              {ESTRATEGIAS.find((e) => e.value === estrategiaSelecionada)?.descricao}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


