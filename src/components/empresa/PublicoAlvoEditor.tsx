import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, X, Plus } from 'lucide-react'
import type { PublicoAlvo, Genero } from '@/types/database'
import { cn } from '@/lib/utils'

const INTERESSES_PADRAO = [
  'Tecnologia',
  'Moda',
  'Esportes',
  'Música',
  'Viagem',
  'Gastronomia',
  'Cinema',
  'Livros',
  'Fitness',
  'Arte',
  'Fotografia',
  'Jogos',
]

interface PublicoAlvoEditorProps {
  value?: PublicoAlvo
  onChange: (publicoAlvo: PublicoAlvo) => void
  className?: string
  disabled?: boolean
}

export function PublicoAlvoEditor({
  value,
  onChange,
  className,
  disabled = false,
}: PublicoAlvoEditorProps) {
  const idadeMin = value?.idade_min ?? 18
  const idadeMax = value?.idade_max ?? 65
  const generos = value?.genero || ['Todos']
  const interesses = value?.interesses || []
  const [interesseCustomizado, setInteresseCustomizado] = useState('')

  const handleIdadeChange = (tipo: 'min' | 'max', valor: number) => {
    let novoMin = idadeMin
    let novoMax = idadeMax

    if (tipo === 'min') {
      novoMin = valor
      if (valor > novoMax) novoMax = valor
    } else {
      novoMax = valor
      if (valor < novoMin) novoMin = valor
    }

    onChange({
      ...value,
      idade_min: novoMin,
      idade_max: novoMax,
      genero: generos,
      interesses: interesses.length > 0 ? interesses : undefined,
    } as PublicoAlvo)
  }

  const handleGeneroToggle = (genero: Genero) => {
    let novosGeneros: Genero[]

    if (genero === 'Todos') {
      novosGeneros = ['Todos']
    } else {
      novosGeneros = generos.includes(genero)
        ? generos.filter((g) => g !== genero)
        : [...generos.filter((g) => g !== 'Todos'), genero]

      if (novosGeneros.length === 0) novosGeneros = ['Todos']
    }

    onChange({
      ...value,
      idade_min: idadeMin,
      idade_max: idadeMax,
      genero: novosGeneros,
      interesses: interesses.length > 0 ? interesses : undefined,
    } as PublicoAlvo)
  }

  const handleInteresseToggle = (interesse: string) => {
    const novosInteresses = interesses.includes(interesse)
      ? interesses.filter((i) => i !== interesse)
      : [...interesses, interesse]

    onChange({
      ...value,
      idade_min: idadeMin,
      idade_max: idadeMax,
      genero: generos,
      interesses: novosInteresses.length > 0 ? novosInteresses : undefined,
    } as PublicoAlvo)
  }

  const handleAdicionarInteresse = () => {
    if (interesseCustomizado.trim() && !interesses.includes(interesseCustomizado.trim())) {
      const novosInteresses = [...interesses, interesseCustomizado.trim()]
      onChange({
        ...value,
        idade_min: idadeMin,
        idade_max: idadeMax,
        genero: generos,
        interesses: novosInteresses,
      } as PublicoAlvo)
      setInteresseCustomizado('')
    }
  }

  const handleRemoverInteresse = (interesse: string) => {
    const novosInteresses = interesses.filter((i) => i !== interesse)
    onChange({
      ...value,
      idade_min: idadeMin,
      idade_max: idadeMax,
      genero: generos,
      interesses: novosInteresses.length > 0 ? novosInteresses : undefined,
    } as PublicoAlvo)
  }

  const generosDisponiveis: Array<{ value: Genero; label: string }> = [
    { value: 'Todos', label: 'Todos' },
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Feminino' },
    { value: 'Outro', label: 'Outro' },
  ]

  return (
    <Card className={cn("card-premium", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Público-Alvo
        </CardTitle>
        <CardDescription>
          Defina o público-alvo da sua campanha
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Idade */}
        <div className="space-y-4">
          <div>
            <Label>Faixa Etária</Label>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Mínima</Label>
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Máxima</Label>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                value={idadeMin}
                onChange={(e) => handleIdadeChange('min', parseInt(e.target.value) || 18)}
                min={13}
                max={idadeMax}
                disabled={disabled}
                className="w-20 h-9"
              />
              <span className="text-muted-foreground">até</span>
              <Input
                type="number"
                value={idadeMax}
                onChange={(e) => handleIdadeChange('max', parseInt(e.target.value) || 65)}
                min={idadeMin}
                max={100}
                disabled={disabled}
                className="w-20 h-9"
              />
              <span className="text-muted-foreground">anos</span>
            </div>
            {idadeMin >= idadeMax && (
              <p className="text-sm text-destructive mt-1">
                A idade mínima deve ser menor que a máxima
              </p>
            )}
          </div>
        </div>

        {/* Gênero */}
        <div className="space-y-2">
          <Label>Gênero</Label>
          <div className="flex flex-wrap gap-2">
            {generosDisponiveis.map((genero) => (
              <div key={genero.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`genero-${genero.value}`}
                  checked={generos.includes(genero.value)}
                  onCheckedChange={() => handleGeneroToggle(genero.value)}
                  disabled={disabled}
                />
                <Label
                  htmlFor={`genero-${genero.value}`}
                  className="cursor-pointer"
                >
                  {genero.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Interesses */}
        <div className="space-y-2">
          <Label>Interesses</Label>
          <div className="h-32 border rounded-lg p-3 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-2">
              {INTERESSES_PADRAO.map((interesse) => (
                <div key={interesse} className="flex items-center space-x-2">
                  <Checkbox
                    id={`interesse-${interesse}`}
                    checked={interesses.includes(interesse)}
                    onCheckedChange={() => handleInteresseToggle(interesse)}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={`interesse-${interesse}`}
                    className="cursor-pointer text-sm"
                  >
                    {interesse}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Adicionar interesse customizado */}
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar interesse..."
              value={interesseCustomizado}
              onChange={(e) => setInteresseCustomizado(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdicionarInteresse()}
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAdicionarInteresse}
              disabled={disabled || !interesseCustomizado.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Interesses selecionados */}
          {interesses.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {interesses.map((interesse) => (
                <Badge key={interesse} variant="secondary" className="gap-1">
                  {interesse}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoverInteresse(interesse)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Resumo do Público-Alvo</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <strong>Idade:</strong> {idadeMin} a {idadeMax} anos
            </p>
            <p>
              <strong>Gênero:</strong> {generos.join(', ')}
            </p>
            {interesses.length > 0 && (
              <p>
                <strong>Interesses:</strong> {interesses.join(', ')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


