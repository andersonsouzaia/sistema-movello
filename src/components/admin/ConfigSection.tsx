import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Configuracao } from '@/types/database'

interface ConfigSectionProps {
  title: string
  description?: string
  configuracoes: Configuracao[]
  onUpdate: (chave: string, valor: any) => void
  loading?: boolean
}

export function ConfigSection({ title, description, configuracoes, onUpdate, loading }: ConfigSectionProps) {
  const renderInput = (config: Configuracao) => {
    switch (config.tipo) {
      case 'boolean':
        return (
          <Switch
            checked={config.valor as boolean}
            onCheckedChange={(checked) => onUpdate(config.chave, checked)}
            disabled={!config.editavel || loading}
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={config.valor as number}
            onChange={(e) => onUpdate(config.chave, parseFloat(e.target.value) || 0)}
            disabled={!config.editavel || loading}
          />
        )
      case 'json':
        return (
          <Input
            type="text"
            value={JSON.stringify(config.valor)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                onUpdate(config.chave, parsed)
              } catch {
                // Invalid JSON, ignore
              }
            }}
            disabled={!config.editavel || loading}
          />
        )
      default:
        return (
          <Input
            type="text"
            value={config.valor as string}
            onChange={(e) => onUpdate(config.chave, e.target.value)}
            disabled={!config.editavel || loading}
          />
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {configuracoes.map((config) => (
          <div key={config.chave} className="space-y-2">
            <Label htmlFor={config.chave}>
              {config.chave.replace(/\./g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Label>
            {config.descricao && <p className="text-sm text-muted-foreground">{config.descricao}</p>}
            {renderInput(config)}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

