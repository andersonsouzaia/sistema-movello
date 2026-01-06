import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Target, Eye, ShoppingCart, Users, Heart, Zap } from 'lucide-react'
import type { ObjetivoPrincipal } from '@/types/database'
import { cn } from '@/lib/utils'

interface Objetivo {
  value: ObjetivoPrincipal
  nome: string
  descricao: string
  icone: any
  cor: string
}

const OBJETIVOS: Objetivo[] = [
  {
    value: 'awareness',
    nome: 'Conscientização',
    descricao: 'Aumentar o conhecimento da marca',
    icone: Eye,
    cor: 'bg-blue-500',
  },
  {
    value: 'consideracao',
    nome: 'Consideração',
    descricao: 'Fazer o público considerar sua marca',
    icone: Target,
    cor: 'bg-purple-500',
  },
  {
    value: 'conversao',
    nome: 'Conversão',
    descricao: 'Gerar vendas ou leads',
    icone: ShoppingCart,
    cor: 'bg-green-500',
  },
  {
    value: 'retencao',
    nome: 'Retenção',
    descricao: 'Fidelizar clientes existentes',
    icone: Users,
    cor: 'bg-orange-500',
  },
  {
    value: 'engajamento',
    nome: 'Engajamento',
    descricao: 'Aumentar interação e engajamento',
    icone: Zap,
    cor: 'bg-yellow-500',
  },
]

interface ObjetivoSelectorProps {
  objetivoPrincipal?: ObjetivoPrincipal
  objetivosSecundarios?: string[]
  onObjetivoPrincipalChange: (objetivo: ObjetivoPrincipal) => void
  onObjetivosSecundariosChange: (objetivos: string[]) => void
  className?: string
  disabled?: boolean
}

export function ObjetivoSelector({
  objetivoPrincipal,
  objetivosSecundarios = [],
  onObjetivoPrincipalChange,
  onObjetivosSecundariosChange,
  className,
  disabled = false,
}: ObjetivoSelectorProps) {
  const [secundarios, setSecundarios] = useState<string[]>(objetivosSecundarios)

  useEffect(() => {
    setSecundarios(objetivosSecundarios)
  }, [objetivosSecundarios])

  const handleObjetivoPrincipalClick = (objetivo: ObjetivoPrincipal) => {
    if (!disabled) {
      onObjetivoPrincipalChange(objetivo)
    }
  }

  const handleObjetivoSecundarioToggle = (objetivo: ObjetivoPrincipal) => {
    if (objetivo === objetivoPrincipal) return // Não pode ser secundário se for principal

    const novosSecundarios = secundarios.includes(objetivo)
      ? secundarios.filter((o) => o !== objetivo)
      : [...secundarios, objetivo]
    
    setSecundarios(novosSecundarios)
    onObjetivosSecundariosChange(novosSecundarios)
  }

  return (
    <Card className={cn("card-premium", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Objetivos da Campanha
        </CardTitle>
        <CardDescription>
          Selecione o objetivo principal e objetivos secundários (opcional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Objetivo Principal */}
        <div className="space-y-3">
          <Label>Objetivo Principal *</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {OBJETIVOS.map((objetivo) => {
              const Icon = objetivo.icone
              const selecionado = objetivoPrincipal === objetivo.value
              
              return (
                <button
                  key={objetivo.value}
                  type="button"
                  onClick={() => handleObjetivoPrincipalClick(objetivo.value)}
                  disabled={disabled}
                  className={cn(
                    "p-4 border-2 rounded-lg text-left transition-all",
                    "hover:border-primary hover:shadow-md",
                    selecionado
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-muted",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      selecionado ? objetivo.cor : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        selecionado ? "text-white" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        "font-medium",
                        selecionado && "text-primary"
                      )}>
                        {objetivo.nome}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {objetivo.descricao}
                      </p>
                    </div>
                    {selecionado && (
                      <Badge variant="default">Principal</Badge>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Objetivos Secundários */}
        {objetivoPrincipal && (
          <div className="space-y-3">
            <Label>Objetivos Secundários (Opcional)</Label>
            <div className="space-y-2">
              {OBJETIVOS.filter((o) => o.value !== objetivoPrincipal).map((objetivo) => {
                const Icon = objetivo.icone
                const selecionado = secundarios.includes(objetivo.value)
                
                return (
                  <div key={objetivo.value} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      id={`secundario-${objetivo.value}`}
                      checked={selecionado}
                      onCheckedChange={() => handleObjetivoSecundarioToggle(objetivo.value)}
                      disabled={disabled}
                    />
                    <Label
                      htmlFor={`secundario-${objetivo.value}`}
                      className="flex-1 cursor-pointer flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{objetivo.nome}</span>
                      <span className="text-xs text-muted-foreground">- {objetivo.descricao}</span>
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Preview */}
        {objetivoPrincipal && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Resumo dos Objetivos</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">
                Principal: {OBJETIVOS.find((o) => o.value === objetivoPrincipal)?.nome}
              </Badge>
              {secundarios.length > 0 && (
                <>
                  {secundarios.map((obj) => (
                    <Badge key={obj} variant="secondary">
                      {OBJETIVOS.find((o) => o.value === obj)?.nome}
                    </Badge>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

