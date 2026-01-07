import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Save, Play, Loader2, Plus, Trash2 } from 'lucide-react'
import type { Automatizacao } from '@/types/database'

const automationSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  trigger_evento: z.string().min(1, 'Trigger é obrigatório'),
  condicoes: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.string(),
  })).optional().default([]),
  acoes: z.array(z.object({
    type: z.string().min(1, 'Tipo de ação é obrigatório'),
    params: z.record(z.any()),
  })).min(1, 'Pelo menos uma ação é obrigatória'),
  ativo: z.boolean().default(true),
})

type AutomationFormValues = z.infer<typeof automationSchema>

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
  params: Record<string, any>
}

export function AutomationEditor({ automation, onSave, loading }: AutomationEditorProps) {
  const parseJsonField = (value: any): any => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return []
      }
    }
    return value || []
  }

  const form = useForm<AutomationFormValues>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      nome: automation?.nome || '',
      trigger_evento: automation?.trigger_evento || automation?.trigger || '',
      condicoes: parseJsonField(automation?.condicoes) as Condition[],
      acoes: parseJsonField(automation?.acoes) as Action[],
      ativo: automation?.ativo ?? true,
    },
  })

  const condicoes = form.watch('condicoes') || []
  const acoes = form.watch('acoes') || []

  const handleSave = async (values: AutomationFormValues) => {
    if (!onSave) return

    await onSave({
      nome: values.nome,
      trigger_evento: values.trigger_evento,
      condicoes: values.condicoes as any,
      acoes: values.acoes as any,
      ativo: values.ativo,
    })
  }

  const addCondition = () => {
    const current = form.getValues('condicoes') || []
    form.setValue('condicoes', [...current, { field: '', operator: 'equals', value: '' }])
  }

  const removeCondition = (index: number) => {
    const current = form.getValues('condicoes') || []
    form.setValue('condicoes', current.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, field: string, value: any) => {
    const current = form.getValues('condicoes') || []
    const updated = [...current]
    updated[index] = { ...updated[index], [field]: value }
    form.setValue('condicoes', updated)
  }

  const addAction = () => {
    const current = form.getValues('acoes') || []
    form.setValue('acoes', [...current, { type: '', params: {} }])
  }

  const removeAction = (index: number) => {
    const current = form.getValues('acoes') || []
    form.setValue('acoes', current.filter((_, i) => i !== index))
  }

  const updateAction = (index: number, field: string, value: any) => {
    const current = form.getValues('acoes') || []
    const updated = [...current]
    if (field === 'type') {
      updated[index] = { type: value, params: {} }
    } else {
      updated[index] = { ...updated[index], params: { ...updated[index].params, [field]: value } }
    }
    form.setValue('acoes', updated)
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
            <Badge variant={form.watch('ativo') ? 'default' : 'secondary'}>
              {form.watch('ativo') ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Automação</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Notificar quando campanha for aprovada" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trigger_evento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trigger (Evento)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um evento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableTriggers.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Condições (Opcional)</Label>
            <Button variant="outline" size="sm" onClick={addCondition}>
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
            <Button variant="outline" size="sm" onClick={addAction}>
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
                        value={action.params.template || ''}
                        onChange={(e) => updateAction(index, 'template', e.target.value)}
                      />
                      <Input
                        placeholder="Destinatário (variável)"
                        value={action.params.to || ''}
                        onChange={(e) => updateAction(index, 'to', e.target.value)}
                      />
                    </div>
                  )}
                  {action.type === 'criar_notificacao' && (
                    <div className="space-y-2 pl-4 border-l-2">
                      <Input
                        placeholder="Título"
                        value={action.params.title || ''}
                        onChange={(e) => updateAction(index, 'title', e.target.value)}
                      />
                      <Textarea
                        placeholder="Mensagem"
                        value={action.params.message || ''}
                        onChange={(e) => updateAction(index, 'message', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Automação Ativa</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

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
        </Form>
      </CardContent>
    </Card>
  )
}

