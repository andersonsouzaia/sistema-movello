import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NichoSelector } from './NichoSelector'
import { PublicoAlvoEditor } from './PublicoAlvoEditor'
import { HorarioExibicaoEditor } from './HorarioExibicaoEditor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target } from 'lucide-react'
import type { PublicoAlvo, HorarioExibicao } from '@/types/database'

interface SegmentacaoAdvancedProps {
  nicho?: string
  categorias?: string[]
  publicoAlvo?: PublicoAlvo
  horariosExibicao?: HorarioExibicao
  diasSemana?: number[]
  onNichoChange: (nicho: string) => void
  onCategoriasChange: (categorias: string[]) => void
  onPublicoAlvoChange: (publicoAlvo: PublicoAlvo) => void
  onHorariosChange: (horarios: HorarioExibicao) => void
  onDiasSemanaChange: (dias: number[]) => void
  className?: string
  disabled?: boolean
}

export function SegmentacaoAdvanced({
  nicho,
  categorias,
  publicoAlvo,
  horariosExibicao,
  diasSemana,
  onNichoChange,
  onCategoriasChange,
  onPublicoAlvoChange,
  onHorariosChange,
  onDiasSemanaChange,
  className,
  disabled = false,
}: SegmentacaoAdvancedProps) {
  const [abaAtiva, setAbaAtiva] = useState('nicho')

  return (
    <div className={className}>
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Segmentação Avançada
          </CardTitle>
          <CardDescription>
            Defina nicho, público-alvo e horários de exibição da campanha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="nicho">Nicho</TabsTrigger>
              <TabsTrigger value="publico">Público-Alvo</TabsTrigger>
              <TabsTrigger value="horarios">Horários</TabsTrigger>
            </TabsList>

            <TabsContent value="nicho" className="mt-4">
              <NichoSelector
                nicho={nicho}
                categorias={categorias}
                onNichoChange={onNichoChange}
                onCategoriasChange={onCategoriasChange}
                disabled={disabled}
              />
            </TabsContent>

            <TabsContent value="publico" className="mt-4">
              <PublicoAlvoEditor
                value={publicoAlvo}
                onChange={onPublicoAlvoChange}
                disabled={disabled}
              />
            </TabsContent>

            <TabsContent value="horarios" className="mt-4">
              <HorarioExibicaoEditor
                value={horariosExibicao}
                diasSemana={diasSemana}
                onHorariosChange={onHorariosChange}
                onDiasSemanaChange={onDiasSemanaChange}
                disabled={disabled}
              />
            </TabsContent>
          </Tabs>

          {/* Preview Consolidado */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium mb-3">Resumo da Segmentação</h4>
            <div className="space-y-2 text-sm">
              {nicho && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Nicho:</span>
                  <Badge variant="secondary">{nicho}</Badge>
                  {categorias && categorias.length > 0 && (
                    <>
                      <span className="text-muted-foreground">Categorias:</span>
                      {categorias.map((cat) => (
                        <Badge key={cat} variant="outline">{cat}</Badge>
                      ))}
                    </>
                  )}
                </div>
              )}
              {publicoAlvo && (
                <div>
                  <span className="text-muted-foreground">Público:</span>
                  <span className="ml-2">
                    {publicoAlvo.idade_min || 18}-{publicoAlvo.idade_max || 65} anos,
                    {' '}
                    {publicoAlvo.genero?.join(', ') || 'Todos'}
                    {publicoAlvo.interesses && publicoAlvo.interesses.length > 0 && (
                      <> - {publicoAlvo.interesses.length} interesse(s)</>
                    )}
                  </span>
                </div>
              )}
              {diasSemana && diasSemana.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Dias ativos:</span>
                  <span className="ml-2">{diasSemana.length} dia(s) da semana</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


