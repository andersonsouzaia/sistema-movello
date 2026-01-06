import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, X, MapPin } from 'lucide-react'
import { buscarCidades, ESTADOS_BRASIL } from '@/utils/geocoding'
import { cn } from '@/lib/utils'

interface CityStateSelectorProps {
  cidades?: string[]
  estados?: string[]
  onCidadesChange: (cidades: string[]) => void
  onEstadosChange: (estados: string[]) => void
  tipo: 'cidade' | 'estado' | 'ambos'
  className?: string
  disabled?: boolean
}

export function CityStateSelector({
  cidades = [],
  estados = [],
  onCidadesChange,
  onEstadosChange,
  tipo,
  className,
  disabled = false,
}: CityStateSelectorProps) {
  const [buscaCidade, setBuscaCidade] = useState('')
  const [resultadosCidade, setResultadosCidade] = useState<Array<{ nome: string; estado: string }>>([])
  const [buscandoCidades, setBuscandoCidades] = useState(false)

  const handleBuscarCidades = async () => {
    if (!buscaCidade.trim()) {
      setResultadosCidade([])
      return
    }

    setBuscandoCidades(true)
    try {
      const resultados = await buscarCidades(buscaCidade)
      setResultadosCidade(resultados)
    } catch (error) {
      console.error('Erro ao buscar cidades:', error)
      setResultadosCidade([])
    } finally {
      setBuscandoCidades(false)
    }
  }

  const handleAdicionarCidade = (cidade: { nome: string; estado: string }) => {
    const cidadeCompleta = `${cidade.nome}, ${cidade.estado}`
    if (!cidades.includes(cidadeCompleta)) {
      onCidadesChange([...cidades, cidadeCompleta])
    }
    setBuscaCidade('')
    setResultadosCidade([])
  }

  const handleRemoverCidade = (cidade: string) => {
    onCidadesChange(cidades.filter((c) => c !== cidade))
  }

  const handleToggleEstado = (sigla: string) => {
    if (estados.includes(sigla)) {
      onEstadosChange(estados.filter((e) => e !== sigla))
    } else {
      onEstadosChange([...estados, sigla])
    }
  }

  const estadosSelecionados = useMemo(() => {
    return ESTADOS_BRASIL.filter((estado) => estados.includes(estado.sigla))
  }, [estados])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Seleção de Cidades */}
      {(tipo === 'cidade' || tipo === 'ambos') && (
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Cidades
            </CardTitle>
            <CardDescription>
              Selecione as cidades onde a campanha será exibida
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Busca de Cidades */}
            <div className="space-y-2">
              <Label>Buscar Cidade</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o nome da cidade..."
                  value={buscaCidade}
                  onChange={(e) => {
                    setBuscaCidade(e.target.value)
                    if (e.target.value.trim()) {
                      handleBuscarCidades()
                    } else {
                      setResultadosCidade([])
                    }
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleBuscarCidades()}
                  disabled={disabled}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBuscarCidades}
                  disabled={disabled}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Resultados da Busca */}
            {resultadosCidade.length > 0 && (
              <div className="space-y-2">
                <Label>Resultados</Label>
                <ScrollArea className="h-32 border rounded-lg p-2">
                  <div className="space-y-1">
                    {resultadosCidade.map((cidade, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleAdicionarCidade(cidade)}
                        disabled={disabled}
                      >
                        {cidade.nome}, {cidade.estado}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Cidades Selecionadas */}
            {cidades.length > 0 && (
              <div className="space-y-2">
                <Label>Cidades Selecionadas ({cidades.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {cidades.map((cidade) => (
                    <Badge key={cidade} variant="secondary" className="gap-1">
                      {cidade}
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => handleRemoverCidade(cidade)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seleção de Estados */}
      {(tipo === 'estado' || tipo === 'ambos') && (
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Estados
            </CardTitle>
            <CardDescription>
              Selecione os estados onde a campanha será exibida
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lista de Estados */}
            <ScrollArea className="h-64 border rounded-lg p-4">
              <div className="space-y-2">
                {ESTADOS_BRASIL.map((estado) => (
                  <div key={estado.sigla} className="flex items-center space-x-2">
                    <Checkbox
                      id={`estado-${estado.sigla}`}
                      checked={estados.includes(estado.sigla)}
                      onCheckedChange={() => handleToggleEstado(estado.sigla)}
                      disabled={disabled}
                    />
                    <Label
                      htmlFor={`estado-${estado.sigla}`}
                      className="flex-1 cursor-pointer"
                    >
                      {estado.nome} ({estado.sigla})
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Estados Selecionados */}
            {estadosSelecionados.length > 0 && (
              <div className="space-y-2">
                <Label>Estados Selecionados ({estadosSelecionados.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {estadosSelecionados.map((estado) => (
                    <Badge key={estado.sigla} variant="secondary">
                      {estado.nome} ({estado.sigla})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

