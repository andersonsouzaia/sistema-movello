import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfigSection } from '@/components/admin/ConfigSection'
import { TemplateEditor } from '@/components/admin/TemplateEditor'
import { AutomationEditor } from '@/components/admin/AutomationEditor'
import { Button } from '@/components/ui/button'
import { useConfiguracoes, useTemplatesEmail, useAutomatizacoes } from '@/hooks/useConfiguracoes'
import { configuracaoService } from '@/services/configuracaoService'
import { useAuth } from '@/contexts/AuthContext'
import { Save, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TemplateEmail, Automatizacao } from '@/types/database'

export default function AdminConfiguracoes() {
  const { user } = useAuth()
  const [saving, setSaving] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<TemplateEmail | null>(null)
  const [editingAutomation, setEditingAutomation] = useState<Automatizacao | null>(null)
  
  const { configuracoes: geralConfigs, loading: loadingGeral, refetch: refetchGeral } = useConfiguracoes('geral')
  const { configuracoes: campanhasConfigs, loading: loadingCampanhas, refetch: refetchCampanhas } = useConfiguracoes('campanhas')
  const { configuracoes: financeiroConfigs, loading: loadingFinanceiro, refetch: refetchFinanceiro } = useConfiguracoes('financeiro')
  const { configuracoes: notificacoesConfigs, loading: loadingNotificacoes, refetch: refetchNotificacoes } = useConfiguracoes('notificacoes')
  const { configuracoes: segurancaConfigs, loading: loadingSeguranca, refetch: refetchSeguranca } = useConfiguracoes('seguranca')
  
  const { templates, loading: loadingTemplates, refetch: refetchTemplates } = useTemplatesEmail()
  const { automatizacoes, loading: loadingAutomatizacoes, refetch: refetchAutomatizacoes } = useAutomatizacoes()

  const handleUpdateConfig = async (chave: string, valor: any, categoria: string) => {
    if (!user?.id) return
    
    setSaving(chave)
    try {
      const result = await configuracaoService.updateConfiguracao(chave, valor, user.id)
      if (result.success) {
        // Refetch da categoria específica
        switch (categoria) {
          case 'geral':
            refetchGeral()
            break
          case 'campanhas':
            refetchCampanhas()
            break
          case 'financeiro':
            refetchFinanceiro()
            break
          case 'notificacoes':
            refetchNotificacoes()
            break
          case 'seguranca':
            refetchSeguranca()
            break
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error)
    } finally {
      setSaving(null)
    }
  }

  return (
    <ProtectedRoute requiredUserType="admin">
      <RequirePermission permission="configuracoes.read">
        <DashboardLayout>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-4xl font-display font-bold text-foreground mb-2">Configurações</h1>
              <p className="text-lg text-muted-foreground">Gerencie as configurações do sistema</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Tabs defaultValue="geral" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="geral">Geral</TabsTrigger>
                  <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
                  <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
                  <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
                  <TabsTrigger value="seguranca">Segurança</TabsTrigger>
                  <TabsTrigger value="templates">Templates de Email</TabsTrigger>
                  <TabsTrigger value="automatizacoes">Automações</TabsTrigger>
                </TabsList>

                <TabsContent value="geral" className="space-y-4">
                  <ConfigSection
                    title="Configurações Gerais"
                    description="Configurações básicas do sistema"
                    configuracoes={geralConfigs}
                    onUpdate={(chave, valor) => handleUpdateConfig(chave, valor, 'geral')}
                    loading={loadingGeral || saving !== null}
                  />
                </TabsContent>

                <TabsContent value="campanhas" className="space-y-4">
                  <ConfigSection
                    title="Configurações de Campanhas"
                    description="Parâmetros relacionados a campanhas publicitárias"
                    configuracoes={campanhasConfigs}
                    onUpdate={(chave, valor) => handleUpdateConfig(chave, valor, 'campanhas')}
                    loading={loadingCampanhas || saving !== null}
                  />
                </TabsContent>

                <TabsContent value="financeiro" className="space-y-4">
                  <ConfigSection
                    title="Configurações Financeiras"
                    description="Parâmetros de pagamentos e repasses"
                    configuracoes={financeiroConfigs}
                    onUpdate={(chave, valor) => handleUpdateConfig(chave, valor, 'financeiro')}
                    loading={loadingFinanceiro || saving !== null}
                  />
                </TabsContent>

                <TabsContent value="notificacoes" className="space-y-4">
                  <ConfigSection
                    title="Configurações de Notificações"
                    description="Parâmetros de notificações e comunicações"
                    configuracoes={notificacoesConfigs}
                    onUpdate={(chave, valor) => handleUpdateConfig(chave, valor, 'notificacoes')}
                    loading={loadingNotificacoes || saving !== null}
                  />
                </TabsContent>

                <TabsContent value="seguranca" className="space-y-4">
                  <ConfigSection
                    title="Configurações de Segurança"
                    description="Parâmetros de segurança e autenticação"
                    configuracoes={segurancaConfigs}
                    onUpdate={(chave, valor) => handleUpdateConfig(chave, valor, 'seguranca')}
                    loading={loadingSeguranca || saving !== null}
                  />
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">Templates de E-mail</h2>
                      <p className="text-muted-foreground">
                        Gerencie os templates de e-mail enviados pelo sistema
                      </p>
                    </div>
                    <Button
                      onClick={() => setEditingTemplate(null)}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Template
                    </Button>
                  </div>
                  
                  {loadingTemplates ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : editingTemplate === null && templates.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground mb-4">Nenhum template cadastrado</p>
                        <Button onClick={() => setEditingTemplate(null)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Primeiro Template
                        </Button>
                      </CardContent>
                    </Card>
                  ) : editingTemplate === null ? (
                    <div className="grid gap-4">
                      {templates.map((template) => (
                        <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setEditingTemplate(template)}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle>{template.nome}</CardTitle>
                              <Button variant="ghost" size="sm" onClick={(e) => {
                                e.stopPropagation()
                                setEditingTemplate(template)
                              }}>
                                Editar
                              </Button>
                            </div>
                            <CardDescription>{template.assunto}</CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <TemplateEditor
                      template={editingTemplate}
                      onSave={async (data) => {
                        if (!user?.id) return
                        setSaving('template')
                        try {
                          if (editingTemplate) {
                            await configuracaoService.updateTemplateEmail(editingTemplate.id, data, user.id)
                          } else {
                            await configuracaoService.createTemplateEmail(data as any, user.id)
                          }
                          setEditingTemplate(null)
                          refetchTemplates()
                        } finally {
                          setSaving(null)
                        }
                      }}
                      loading={saving === 'template'}
                    />
                  )}
                </TabsContent>

                <TabsContent value="automatizacoes" className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">Automações</h2>
                      <p className="text-muted-foreground">
                        Crie e gerencie fluxos de trabalho automatizados
                      </p>
                    </div>
                    <Button
                      onClick={() => setEditingAutomation(null)}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Automação
                    </Button>
                  </div>
                  
                  {loadingAutomatizacoes ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : editingAutomation === null && automatizacoes.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground mb-4">Nenhuma automação cadastrada</p>
                        <Button onClick={() => setEditingAutomation(null)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Primeira Automação
                        </Button>
                      </CardContent>
                    </Card>
                  ) : editingAutomation === null ? (
                    <div className="grid gap-4">
                      {automatizacoes.map((automation) => (
                        <Card key={automation.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setEditingAutomation(automation)}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle>{automation.nome}</CardTitle>
                              <Button variant="ghost" size="sm" onClick={(e) => {
                                e.stopPropagation()
                                setEditingAutomation(automation)
                              }}>
                                Editar
                              </Button>
                            </div>
                            <CardDescription>Trigger: {automation.trigger_evento || automation.trigger || 'N/A'}</CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <AutomationEditor
                      automation={editingAutomation}
                      onSave={async (data) => {
                        if (!user?.id) return
                        setSaving('automation')
                        try {
                          if (editingAutomation) {
                            await configuracaoService.updateAutomatizacao(editingAutomation.id, data, user.id)
                          } else {
                            await configuracaoService.createAutomatizacao(data as any, user.id)
                          }
                          setEditingAutomation(null)
                          refetchAutomatizacoes()
                        } finally {
                          setSaving(null)
                        }
                      }}
                      loading={saving === 'automation'}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </DashboardLayout>
      </RequirePermission>
    </ProtectedRoute>
  )
}
