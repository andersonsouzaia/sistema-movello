import { useState, useEffect, useCallback } from 'react'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LocationRadiusPickerProps {
  value?: number
  onChange: (raio: number) => void
  min?: number
  max?: number
  step?: number
  presets?: number[]
  className?: string
  disabled?: boolean
}

const PRESETS_PADRAO = [0.5, 1, 2, 5, 10, 20, 50]

export function LocationRadiusPicker({
  value = 1,
  onChange,
  min = 0.5,
  max = 50,
  step = 0.1,
  presets = PRESETS_PADRAO,
  className,
  disabled = false,
}: LocationRadiusPickerProps) {
  // Usar value diretamente como estado controlado, sem estado interno
  const raio = value ?? 1
  const [inputValue, setInputValue] = useState<string>(raio.toString())

  // Sincronizar input apenas quando value mudar externamente (não por onChange interno)
  useEffect(() => {
    setInputValue(raio.toString())
  }, [raio])

  const handleSliderChange = useCallback((values: number[]) => {
    const novoRaio = values[0]
    setInputValue(novoRaio.toFixed(1))
    onChange(novoRaio)
  }, [onChange])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setInputValue(valor)
    
    const numero = parseFloat(valor)
    if (!isNaN(numero) && numero >= min && numero <= max) {
      onChange(numero)
    }
  }, [onChange, min, max])

  const handleInputBlur = useCallback(() => {
    const numero = parseFloat(inputValue)
    if (isNaN(numero) || numero < min) {
      setInputValue(min.toString())
      onChange(min)
    } else if (numero > max) {
      setInputValue(max.toString())
      onChange(max)
    } else {
      setInputValue(numero.toFixed(1))
      onChange(numero)
    }
  }, [inputValue, min, max, onChange])

  const handlePresetClick = useCallback((preset: number) => {
    setInputValue(preset.toString())
    onChange(preset)
  }, [onChange])

  return (
    <Card className={cn("card-premium", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Raio de Cobertura
        </CardTitle>
        <CardDescription>
          Defina o raio em quilômetros para a área de cobertura da campanha
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Raio: {raio.toFixed(1)} km</Label>
            <span className="text-sm text-muted-foreground">
              {min} km - {max} km
            </span>
          </div>
          <Slider
            value={[raio]}
            onValueChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="w-full"
          />
        </div>

        {/* Input numérico */}
        <div className="space-y-2">
          <Label htmlFor="raio-input">Raio (km)</Label>
          <Input
            id="raio-input"
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="h-11"
          />
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <Label>Presets Rápidos</Label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={raio === preset ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetClick(preset)}
                disabled={disabled}
              >
                {preset} km
              </Button>
            ))}
          </div>
        </div>

        {/* Informações */}
        <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Área de cobertura:</strong> {Math.PI * raio * raio} km²
          </p>
          <p>
            <strong>Diâmetro:</strong> {raio * 2} km
          </p>
          <p className="text-xs">
            A campanha será exibida quando o veículo estiver dentro deste raio do ponto central.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

