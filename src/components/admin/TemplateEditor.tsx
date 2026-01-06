import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Save, Eye, Loader2 } from 'lucide-react'
import type { TemplateEmail } from '@/types/database'

const templateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  assunto: z.string().min(1, 'Assunto é obrigatório').max(200, 'Assunto muito longo'),
  corpo_html: z.string().min(1, 'Corpo HTML é obrigatório'),
  corpo_texto: z.string().min(1, 'Corpo texto é obrigatório'),
  ativo: z.boolean().default(true),
})

type TemplateFormValues = z.infer<typeof templateSchema>

interface TemplateEditorProps {
  template?: TemplateEmail
  onSave?: (data: Partial<TemplateEmail>) => Promise<void>
  loading?: boolean
}

const availableVariables = [
  { name: '{{nome}}', description: 'Nome do usuário' },
  { name: '{{email}}', description: 'Email do usuário' },
  { name: '{{empresa}}', description: 'Nome da empresa' },
  { name: '{{campanha}}', description: 'Nome da campanha' },
  { name: '{{ticket}}', description: 'Número do ticket' },
  { name: '{{data}}', description: 'Data atual' },
  { name: '{{link}}', description: 'Link personalizado' },
]

export function TemplateEditor({ template, onSave, loading }: TemplateEditorProps) {
  const [previewMode, setPreviewMode] = useState(false)
  
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      nome: template?.nome || '',
      assunto: template?.assunto || '',
      corpo_html: template?.corpo_html || '',
      corpo_texto: template?.corpo_texto || '',
      ativo: template?.ativo ?? true,
    },
  })

  // Extrair variáveis do conteúdo
  const extractVariables = (content: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g
    const matches = content.matchAll(regex)
    const vars = new Set<string>()
    for (const match of matches) {
      vars.add(match[1])
    }
    return Array.from(vars)
  }

  const handleSave = async (values: TemplateFormValues) => {
    if (!onSave) return

    // Extrair variáveis do conteúdo HTML e texto
    const htmlVars = extractVariables(values.corpo_html)
    const textVars = extractVariables(values.corpo_texto)
    const allVars = Array.from(new Set([...htmlVars, ...textVars]))

    await onSave({
      nome: values.nome,
      assunto: values.assunto,
      corpo_html: values.corpo_html,
      corpo_texto: values.corpo_texto,
      variaveis: allVars,
      ativo: values.ativo,
    })
  }

  const insertVariable = (variable: string, field: 'corpo_html' | 'corpo_texto' | 'assunto') => {
    const currentValue = form.getValues(field)
    const textarea = document.getElementById(field) as HTMLTextAreaElement
    
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newText = currentValue.substring(0, start) + variable + currentValue.substring(end)
      form.setValue(field, newText)
      
      // Restaurar foco e posição do cursor
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    } else {
      // Fallback: apenas adicionar ao final
      form.setValue(field, currentValue + variable)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{template ? 'Editar Template' : 'Novo Template'}</CardTitle>
            <CardDescription>
              {template ? `Editando: ${template.nome}` : 'Crie um novo template de e-mail'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={form.watch('ativo') ? 'default' : 'secondary'}>
              {form.watch('ativo') ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Template</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Boas-vindas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assunto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assunto do E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Bem-vindo à Movello!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Variáveis Disponíveis</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Editar' : 'Preview'}
            </Button>
          </div>
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
              {availableVariables.map((variable) => (
                <Button
                  key={variable.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const activeTab = document.querySelector('[role="tab"][aria-selected="true"]')?.getAttribute('value')
                    if (activeTab === 'html') {
                      insertVariable(variable.name, 'corpo_html')
                    } else if (activeTab === 'texto') {
                      insertVariable(variable.name, 'corpo_texto')
                    } else {
                      insertVariable(variable.name, 'assunto')
                    }
                  }}
                  title={variable.description}
                  className="text-xs"
                >
                  {variable.name}
                </Button>
              ))}
            </div>
          </div>

          <Tabs defaultValue="html" className="w-full">
            <TabsList>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="texto">Texto</TabsTrigger>
            </TabsList>
            <TabsContent value="html" className="space-y-2">
              <FormField
                control={form.control}
                name="corpo_html"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corpo HTML</FormLabel>
                    <FormControl>
                      {previewMode ? (
                        <div
                          className="min-h-[400px] p-4 border rounded-lg bg-white"
                          dangerouslySetInnerHTML={{ __html: field.value }}
                        />
                      ) : (
                        <Textarea
                          id="corpo_html"
                          placeholder="Digite o conteúdo HTML do e-mail..."
                          className="min-h-[400px] font-mono text-sm"
                          {...field}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            <TabsContent value="texto" className="space-y-2">
              <FormField
                control={form.control}
                name="corpo_texto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corpo Texto</FormLabel>
                    <FormControl>
                      {previewMode ? (
                        <div className="min-h-[400px] p-4 border rounded-lg bg-white whitespace-pre-wrap">
                          {field.value}
                        </div>
                      ) : (
                        <Textarea
                          id="corpo_texto"
                          placeholder="Digite o conteúdo em texto simples do e-mail..."
                          className="min-h-[400px]"
                          {...field}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>

          <FormField
            control={form.control}
            name="ativo"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Template Ativo</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Editar' : 'Preview'}
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
                  Salvar Template
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

