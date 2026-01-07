import { useState } from 'react'
import { useForm, FieldValues } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Save, Play, Loader2, Plus, Trash2 } from 'lucide-react'
import type { Automatizacao } from '@/types/database'

interface AutomationFormValues {
  nome: string
  trigger_evento: string
  condicoes: Condition[]
  acoes: Action[]
  ativo: boolean
}

interface AutomationEditorProps {
  automation?: Automatizacao
  onSave?: (data: Partial<Automatizacao>) => Promise<void>
  loading?: boolean
}

const availableTriggers = [
  { value: 'campanha.aprovada', label: 'Campanha Aprovada' },
  { value: 'campanha.reprovada', label: 'Campanha Reprovada' },
  { value: 'campanha.ativa', label: 'Campanha Ativada' },
  { value: 'campanha.pausada', label: 'Campanha Pausada' },
  { value: 'ticket.criado', label: 'Ticket Criado' },
  { value: 'ticket.resolvido', label: 'Ticket Resolvido' },
  { value: 'pagamento.processado', label: 'Pagamento Processado' },
  { value: 'repasse.processado', label: 'Repasse Processado' },
  { value: 'usuario.criado', label: 'Usuário Criado' },
  { value: 'empresa.aprovada', label: 'Empresa Aprovada' },
  { value: 'motorista.aprovado', label: 'Motorista Aprovado' },
]

const availableActions = [
  { value: 'enviar_email', label: 'Enviar E-mail' },
  { value: 'criar_notificacao', label: 'Criar Notificação' },
  { value: 'atribuir_ticket', label: 'Atribuir Ticket' },
  { value: 'atualizar_status', label: 'Atualizar Status' },
  { value: 'criar_tag', label: 'Criar Tag' },
]

interface Condition {
  field: string
  operator: string
  value: string
}

interface Action {
  type: string
  params: Record<string, unknown>
}

export function AutomationEditor({ automation, onSave, loading }: AutomationEditorProps) {
  const parseJsonField = (value: unknown): unknown[] => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return []
      }
    }
    return (value as unknown[]) || []
  }

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AutomationFormValues>({
    defaultValues: {
      nome: automation?.nome || '',
      trigger_evento: automation?.trigger_evento || '',
      condicoes: parseJsonField(automation?.condicoes) as Condition[],
      acoes: parseJsonField(automation?.acoes) as Action[],
      ativo: automation?.ativo ?? true,
    },
  })

  const condicoes = watch('condicoes') || []
  const acoes = watch('acoes') || []
  const ativo = watch('ativo')
  const trigger_evento = watch('trigger_evento')

  const onSubmit = async (values: AutomationFormValues) => {
    if (!onSave) return

    if (!values.nome || !values.trigger_evento || values.acoes.length === 0) {
      return
    }

    await onSave({
      nome: values.nome,
      trigger_evento: values.trigger_evento,
      condicoes: values.condicoes as unknown as Automatizacao['condicoes'],
      acoes: values.acoes as unknown as Automatizacao['acoes'],
      ativo: values.ativo,
    })
  }

  const addCondition = () => {
    const current = condicoes || []
    setValue('condicoes', [...current, { field: '', operator: 'equals', value: '' }])
  }

  const removeCondition = (index: number) => {
    const current = condicoes || []
    setValue('condicoes', current.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, field: string, value: string) => {
    const current = condicoes || []
    const updated = [...current]
    updated[index] = { ...updated[index], [field]: value }
    setValue('condicoes', updated)
  }

  const addAction = () => {
    const current = acoes || []
    setValue('acoes', [...current, { type: '', params: {} }])
  }

  const removeAction = (index: number) => {
    const current = acoes || []
    setValue('acoes', current.filter((_, i) => i !== index))
  }

  const updateAction = (index: number, field: string, value: unknown) => {
    const current = acoes || []
    const updated = [...current]
    if (field === 'type') {
      updated[index] = { type: value as string, params: {} }
    } else {
      updated[index] = { ...updated[index], params: { ...updated[index].params, [field]: value } }
    }
    setValue('acoes', updated)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{automation ? 'Editar Automação' : 'Nova Automação'}</CardTitle>
            <CardDescription>
              {automation ? `Editando: ${automation.nome}` : 'Crie uma nova automação'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={ativo ? 'default' : 'secondary'}>
              {ativo ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Automação</Label>
            <Input 
              id="nome"
              placeholder="Ex: Notificar quando campanha for aprovada" 
              {...register('nome', { required: 'Nome é obrigatório' })}
            />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Trigger (Evento)</Label>
            <Select 
              value={trigger_evento} 
              onValueChange={(value) => setValue('trigger_evento', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent>
                {availableTriggers.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Condições (Opcional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Condição
              </Button>
            </div>
            {condicoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma condição. A automação será executada sempre que o trigger ocorrer.</p>
            ) : (
              <div className="space-y-2">
                {condicoes.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <Input
                      placeholder="Campo"
                      value={condition.field}
                      onChange={(e) => updateCondition(index, 'field', e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(index, 'operator', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Igual a</SelectItem>
                        <SelectItem value="not_equals">Diferente de</SelectItem>
                        <SelectItem value="contains">Contém</SelectItem>
                        <SelectItem value="greater_than">Maior que</SelectItem>
                        <SelectItem value="less_than">Menor que</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Valor"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCondition(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Ações</Label>
              <Button type="button" variant="outline" size="sm" onClick={addAction}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Ação
              </Button>
            </div>
            {acoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma ação definida. Adicione pelo menos uma ação.</p>
            ) : (
              <div className="space-y-2">
                {acoes.map((action, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Select
                        value={action.type}
                        onValueChange={(value) => updateAction(index, 'type', value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione uma ação" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableActions.map((a) => (
                            <SelectItem key={a.value} value={a.value}>
                              {a.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAction(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {action.type === 'enviar_email' && (
                      <div className="space-y-2 pl-4 border-l-2">
                        <Input
                          placeholder="Template de e-mail"
                          value={(action.params.template as string) || ''}
                          onChange={(e) => updateAction(index, 'template', e.target.value)}
                        />
                        <Input
                          placeholder="Destinatário (variável)"
                          value={(action.params.to as string) || ''}
                          onChange={(e) => updateAction(index, 'to', e.target.value)}
                        />
                      </div>
                    )}
                    {action.type === 'criar_notificacao' && (
                      <div className="space-y-2 pl-4 border-l-2">
                        <Input
                          placeholder="Título"
                          value={(action.params.title as string) || ''}
                          onChange={(e) => updateAction(index, 'title', e.target.value)}
                        />
                        <Textarea
                          placeholder="Mensagem"
                          value={(action.params.message as string) || ''}
                          onChange={(e) => updateAction(index, 'message', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label>Automação Ativa</Label>
            <Switch 
              checked={ativo} 
              onCheckedChange={(checked) => setValue('ativo', checked)} 
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Testar Automação
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Automação
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
