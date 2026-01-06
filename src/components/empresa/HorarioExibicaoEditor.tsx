import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Copy } from 'lucide-react'
import type { HorarioExibicao } from '@/types/database'
import { cn } from '@/lib/utils'

const DIAS_SEMANA = [
  { numero: 1, nome: 'Segunda-feira', abreviacao: 'Seg' },
  { numero: 2, nome: 'Terça-feira', abreviacao: 'Ter' },
  { numero: 3, nome: 'Quarta-feira', abreviacao: 'Qua' },
  { numero: 4, nome: 'Quinta-feira', abreviacao: 'Qui' },
  { numero: 5, nome: 'Sexta-feira', abreviacao: 'Sex' },
  { numero: 6, nome: 'Sábado', abreviacao: 'Sáb' },
  { numero: 0, nome: 'Domingo', abreviacao: 'Dom' },
]

const PRESETS = {
  comercial: { inicio: '08:00', fim: '18:00' },
  '24h': { inicio: '00:00', fim: '23:59' },
  'fins-semana': { inicio: '08:00', fim: '20:00' },
}

interface HorarioExibicaoEditorProps {
  value?: HorarioExibicao
  diasSemana?: number[]
  onHorariosChange: (horarios: HorarioExibicao) => void
  onDiasSemanaChange: (dias: number[]) => void
  className?: string
  disabled?: boolean
}

export function HorarioExibicaoEditor({
  value,
  diasSemana = [],
  onHorariosChange,
  onDiasSemanaChange,
  className,
  disabled = false,
}: HorarioExibicaoEditorProps) {
  const [horarios, setHorarios] = useState<HorarioExibicao>(
    value || {
      '1': { inicio: '08:00', fim: '18:00' },
      '2': { inicio: '08:00', fim: '18:00' },
      '3': { inicio: '08:00', fim: '18:00' },
      '4': { inicio: '08:00', fim: '18:00' },
      '5': { inicio: '08:00', fim: '18:00' },
      '6': { inicio: '08:00', fim: '18:00' },
      '0': { inicio: '08:00', fim: '18:00' },
    }
  )
  const [diasAtivos, setDiasAtivos] = useState<number[]>(diasSemana.length > 0 ? diasSemana : [1, 2, 3, 4, 5])

  useEffect(() => {
    if (value) {
      setHorarios(value)
    }
  }, [value])

  useEffect(() => {
    if (diasSemana.length > 0) {
      setDiasAtivos(diasSemana)
    }
  }, [diasSemana])

  const handleHorarioChange = (dia: string, campo: 'inicio' | 'fim', valor: string) => {
    setHorarios({
      ...horarios,
      [dia]: {
        ...horarios[dia],
        [campo]: valor,
      },
    })
    onHorariosChange({
      ...horarios,
      [dia]: {
        ...horarios[dia],
        [campo]: valor,
      },
    })
  }

  const handleToggleDia = (diaNumero: number) => {
    const novosDias = diasAtivos.includes(diaNumero)
      ? diasAtivos.filter((d) => d !== diaNumero)
      : [...diasAtivos, diaNumero].sort()
    
    setDiasAtivos(novosDias)
    onDiasSemanaChange(novosDias)
  }

  const handleAplicarPreset = (preset: keyof typeof PRESETS) => {
    const novoHorario: HorarioExibicao = {}
    DIAS_SEMANA.forEach((dia) => {
      novoHorario[dia.numero.toString()] = { ...PRESETS[preset] }
    })
    setHorarios(novoHorario)
    onHorariosChange(novoHorario)
  }

  const handleCopiarHorario = (diaOrigem: string) => {
    const horarioOrigem = horarios[diaOrigem]
    const novoHorario: HorarioExibicao = { ...horarios }
    
    DIAS_SEMANA.forEach((dia) => {
      if (dia.numero.toString() !== diaOrigem) {
        novoHorario[dia.numero.toString()] = { ...horarioOrigem }
      }
    })
    
    setHorarios(novoHorario)
    onHorariosChange(novoHorario)
  }

  return (
    <Card className={cn("card-premium", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horários de Exibição
        </CardTitle>
        <CardDescription>
          Defina os horários em que a campanha será exibida por dia da semana
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Presets */}
        <div className="space-y-2">
          <Label>Presets Rápidos</Label>
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAplicarPreset('comercial')}
              disabled={disabled}
            >
              Horário Comercial (8h-18h)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAplicarPreset('24h')}
              disabled={disabled}
            >
              24 Horas
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAplicarPreset('fins-semana')}
              disabled={disabled}
            >
              Fins de Semana (8h-20h)
            </Button>
          </div>
        </div>

        {/* Grid de Dias */}
        <div className="space-y-3">
          {DIAS_SEMANA.map((dia) => {
            const diaKey = dia.numero.toString()
            const horario = horarios[diaKey] || { inicio: '08:00', fim: '18:00' }
            const ativo = diasAtivos.includes(dia.numero)

            return (
              <div
                key={dia.numero}
                className={cn(
                  "p-4 border rounded-lg space-y-3",
                  !ativo && "opacity-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`dia-${dia.numero}`}
                      checked={ativo}
                      onCheckedChange={() => handleToggleDia(dia.numero)}
                      disabled={disabled}
                    />
                    <Label
                      htmlFor={`dia-${dia.numero}`}
                      className="font-medium cursor-pointer"
                    >
                      {dia.nome}
                    </Label>
                  </div>
                  {ativo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopiarHorario(diaKey)}
                      disabled={disabled}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar
                    </Button>
                  )}
                </div>

                {ativo && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`inicio-${dia.numero}`}>Início</Label>
                      <Input
                        id={`inicio-${dia.numero}`}
                        type="time"
                        value={horario.inicio}
                        onChange={(e) => handleHorarioChange(diaKey, 'inicio', e.target.value)}
                        disabled={disabled}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`fim-${dia.numero}`}>Fim</Label>
                      <Input
                        id={`fim-${dia.numero}`}
                        type="time"
                        value={horario.fim}
                        onChange={(e) => handleHorarioChange(diaKey, 'fim', e.target.value)}
                        disabled={disabled}
                        className="h-11"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Resumo */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Dias Ativos</p>
          <div className="flex flex-wrap gap-2">
            {diasAtivos.map((diaNum) => {
              const dia = DIAS_SEMANA.find((d) => d.numero === diaNum)
              const horario = horarios[diaNum.toString()]
              return (
                <Badge key={diaNum} variant="secondary">
                  {dia?.abreviacao} {horario?.inicio}-{horario?.fim}
                </Badge>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

