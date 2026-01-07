import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Plus, Edit, Trash2, Calendar, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  loadSchedules,
  type ExportSchedule,
} from '@/utils/exportScheduler'
import { formatDateTime } from '@/lib/utils/formatters'

const scheduleSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['csv', 'excel', 'pdf']),
  dataSource: z.string().min(1, 'Fonte de dados é obrigatória'),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:mm)'),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  recipients: z.string().refine(
    (val) => {
      if (!val) return true
      const emails = val.split(',').map((e) => e.trim())
      return emails.every((e) => z.string().email().safeParse(e).success)
    },
    { message: 'Um ou mais emails são inválidos' }
  ),
  enabled: z.boolean().default(true),
})

type ScheduleFormValues = z.infer<typeof scheduleSchema>

interface ExportSchedulerProps {
  dataSources: Array<{ value: string; label: string }>
}

export function ExportScheduler({ dataSources }: ExportSchedulerProps) {
  const [schedules, setSchedules] = useState<ExportSchedule[]>([])
  const [editingSchedule, setEditingSchedule] = useState<ExportSchedule | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      name: '',
      type: 'csv',
      dataSource: '',
      frequency: 'daily',
      time: '09:00',
      recipients: '',
      enabled: true,
    },
  })

  useEffect(() => {
    loadSchedulesList()
  }, [])

  const loadSchedulesList = () => {
    const loaded = loadSchedules()
    setSchedules(loaded)
  }

  const handleOpenDialog = (schedule?: ExportSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule)
      form.reset({
        name: schedule.name,
        type: schedule.type,
        dataSource: schedule.dataSource,
        frequency: schedule.schedule.frequency,
        time: schedule.schedule.time,
        dayOfWeek: schedule.schedule.dayOfWeek,
        dayOfMonth: schedule.schedule.dayOfMonth,
        recipients: schedule.recipients.join(', '),
        enabled: schedule.enabled,
      })
    } else {
      setEditingSchedule(null)
      form.reset()
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (values: ScheduleFormValues) => {
    setLoading(true)
    try {
      const recipients = values.recipients
        ? values.recipients.split(',').map((e) => e.trim()).filter(Boolean)
        : []

      const scheduleData = {
        name: values.name,
        type: values.type,
        dataSource: values.dataSource,
        schedule: {
          frequency: values.frequency,
          time: values.time,
          dayOfWeek: values.dayOfWeek,
          dayOfMonth: values.dayOfMonth,
        },
        recipients,
        enabled: values.enabled,
      }

      if (editingSchedule) {
        updateSchedule(editingSchedule.id, scheduleData)
        toast.success('Agendamento atualizado com sucesso!')
      } else {
        createSchedule(scheduleData)
        toast.success('Agendamento criado com sucesso!')
      }

      setDialogOpen(false)
      loadSchedulesList()
      form.reset()
    } catch (error) {
      toast.error('Erro ao salvar agendamento')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este agendamento?')) return

    if (deleteSchedule(id)) {
      toast.success('Agendamento deletado com sucesso!')
      loadSchedulesList()
    } else {
      toast.error('Erro ao deletar agendamento')
    }
  }

  const frequency = form.watch('frequency')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Agendamentos de Exportação</CardTitle>
            <CardDescription>
              Configure exportações automáticas recorrentes
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}
                </DialogTitle>
                <DialogDescription>
                  Configure um agendamento de exportação automática
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Agendamento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Relatório diário de campanhas" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Exportação</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="csv">CSV</SelectItem>
                              <SelectItem value="excel">Excel</SelectItem>
                              <SelectItem value="pdf">PDF</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fonte de Dados</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dataSources.map((ds) => (
                                <SelectItem key={ds.value} value={ds.value}>
                                  {ds.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequência</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Diário</SelectItem>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="monthly">Mensal</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {frequency === 'weekly' && (
                    <FormField
                      control={form.control}
                      name="dayOfWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia da Semana</FormLabel>
                          <Select
                            onValueChange={(val) => field.onChange(Number(val))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Domingo</SelectItem>
                              <SelectItem value="1">Segunda</SelectItem>
                              <SelectItem value="2">Terça</SelectItem>
                              <SelectItem value="3">Quarta</SelectItem>
                              <SelectItem value="4">Quinta</SelectItem>
                              <SelectItem value="5">Sexta</SelectItem>
                              <SelectItem value="6">Sábado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {frequency === 'monthly' && (
                    <FormField
                      control={form.control}
                      name="dayOfMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia do Mês</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={31}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="recipients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destinatários (emails separados por vírgula)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="email1@exemplo.com, email2@exemplo.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Agendamento Ativo</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        editingSchedule ? 'Atualizar' : 'Criar'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum agendamento configurado. Crie um novo agendamento para começar.
          </p>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{schedule.name}</h3>
                    <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                      {schedule.enabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="outline">{schedule.type.toUpperCase()}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {schedule.schedule.frequency === 'daily' && 'Diário'}
                        {schedule.schedule.frequency === 'weekly' && 'Semanal'}
                        {schedule.schedule.frequency === 'monthly' && 'Mensal'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>
                        {schedule.schedule.time} - Próxima execução:{' '}
                        {schedule.nextRun ? formatDateTime(schedule.nextRun) : 'Não agendado'}
                      </span>
                    </div>
                    {schedule.lastRun && (
                      <div className="text-xs">
                        Última execução: {formatDateTime(schedule.lastRun)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(schedule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(schedule.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

