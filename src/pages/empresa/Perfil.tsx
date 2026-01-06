import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Upload, Save, Lock, Bell, Building2, User } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatCNPJ } from '@/lib/utils/formatters'
import { validatePassword } from '@/lib/utils/validations'

const empresaSchema = z.object({
  razao_social: z.string().min(3, 'Razão social deve ter no mínimo 3 caracteres'),
  nome_fantasia: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  telefone_comercial: z.string().optional(),
})

const senhaSchema = z.object({
  senha_atual: z.string().min(1, 'Senha atual é obrigatória'),
  nova_senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmar_senha: z.string().min(8, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.nova_senha === data.confirmar_senha, {
  message: 'As senhas não coincidem',
  path: ['confirmar_senha'],
}).refine((data) => {
  const validation = validatePassword(data.nova_senha)
  return validation.valid
}, {
  message: 'Senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula e um número',
  path: ['nova_senha'],
})

type EmpresaFormData = z.infer<typeof empresaSchema>
type SenhaFormData = z.infer<typeof senhaSchema>

export default function EmpresaPerfil() {
  const { empresa, profile, refreshUser } = useAuth()
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [updatingEmpresa, setUpdatingEmpresa] = useState(false)
  const [updatingSenha, setUpdatingSenha] = useState(false)

  const empresaForm = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      razao_social: empresa?.razao_social || '',
      nome_fantasia: empresa?.nome_fantasia || '',
      instagram: empresa?.instagram || '',
      website: empresa?.website || '',
      telefone_comercial: empresa?.telefone_comercial || '',
    },
  })

  const senhaForm = useForm<SenhaFormData>({
    resolver: zodResolver(senhaSchema),
    defaultValues: {
      senha_atual: '',
      nova_senha: '',
      confirmar_senha: '',
    },
  })

  // Reset form quando empresa carregar
  useEffect(() => {
    if (empresa) {
      empresaForm.reset({
        razao_social: empresa.razao_social,
        nome_fantasia: empresa.nome_fantasia || '',
        instagram: empresa.instagram || '',
        website: empresa.website || '',
        telefone_comercial: empresa.telefone_comercial || '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa])

  const handleUpdateEmpresa = async (data: EmpresaFormData) => {
    if (!empresa?.id) {
      toast.error('Empresa não encontrada')
      return
    }

    setUpdatingEmpresa(true)
    try {
      const { error } = await supabase
        .from('empresas')
        .update({
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia || null,
          instagram: data.instagram || null,
          website: data.website || null,
          telefone_comercial: data.telefone_comercial || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', empresa.id)

      if (error) {
        throw error
      }

      toast.success('Dados atualizados com sucesso!')
      refreshUser()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar dados'
      toast.error(errorMessage)
      console.error('Erro ao atualizar empresa:', error)
    } finally {
      setUpdatingEmpresa(false)
    }
  }

  const handleUpdateSenha = async (data: SenhaFormData) => {
    setUpdatingSenha(true)
    try {
      // Verificar senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: data.senha_atual,
      })

      if (signInError) {
        throw new Error('Senha atual incorreta')
      }

      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.nova_senha,
      })

      if (updateError) {
        throw updateError
      }

      toast.success('Senha alterada com sucesso!')
      senhaForm.reset()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao alterar senha'
      toast.error(errorMessage)
      console.error('Erro ao alterar senha:', error)
    } finally {
      setUpdatingSenha(false)
    }
  }

  const handleUploadAvatar = async (file: File) => {
    if (!empresa?.id || !profile?.id) {
      toast.error('Empresa não encontrada')
      return
    }

    setUploadingAvatar(true)
    try {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem')
      }

      // Validar tamanho (máximo 2MB)
      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 2MB')
      }

      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${empresa.id}/avatar.${fileExt}`
      const filePath = `empresas/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Atualizar avatar no perfil do usuário
      const { error: updateError } = await supabase
        .from('users')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (updateError) {
        throw updateError
      }

      toast.success('Avatar atualizado com sucesso!')
      refreshUser()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload do avatar'
      toast.error(errorMessage)
      console.error('Erro ao fazer upload do avatar:', error)
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <ProtectedRoute requiredUserType="empresa">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-4xl font-display font-bold text-foreground mb-2">
              Perfil
            </h1>
            <p className="text-lg text-muted-foreground">
              Edite os dados da sua empresa
            </p>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="dados" className="space-y-6">
            <TabsList>
              <TabsTrigger value="dados">
                <Building2 className="h-4 w-4 mr-2" />
                Dados da Empresa
              </TabsTrigger>
              <TabsTrigger value="senha">
                <Lock className="h-4 w-4 mr-2" />
                Alterar Senha
              </TabsTrigger>
              <TabsTrigger value="avatar">
                <User className="h-4 w-4 mr-2" />
                Avatar
              </TabsTrigger>
            </TabsList>

            {/* Tab: Dados da Empresa */}
            <TabsContent value="dados" className="space-y-6">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Informações da Empresa</CardTitle>
                  <CardDescription>Atualize os dados cadastrais da sua empresa</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={empresaForm.handleSubmit(handleUpdateEmpresa)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="razao_social">Razão Social *</Label>
                        <Input
                          id="razao_social"
                          {...empresaForm.register('razao_social')}
                          className="h-11"
                        />
                        {empresaForm.formState.errors.razao_social && (
                          <p className="text-sm text-destructive">
                            {empresaForm.formState.errors.razao_social.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                        <Input
                          id="nome_fantasia"
                          {...empresaForm.register('nome_fantasia')}
                          className="h-11"
                        />
                        {empresaForm.formState.errors.nome_fantasia && (
                          <p className="text-sm text-destructive">
                            {empresaForm.formState.errors.nome_fantasia.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={empresa?.cnpj ? formatCNPJ(empresa.cnpj) : ''}
                        disabled
                        className="h-11 bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        CNPJ não pode ser alterado
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          {...empresaForm.register('instagram')}
                          placeholder="@sua_empresa"
                          className="h-11"
                        />
                        {empresaForm.formState.errors.instagram && (
                          <p className="text-sm text-destructive">
                            {empresaForm.formState.errors.instagram.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          {...empresaForm.register('website')}
                          placeholder="https://exemplo.com.br"
                          className="h-11"
                        />
                        {empresaForm.formState.errors.website && (
                          <p className="text-sm text-destructive">
                            {empresaForm.formState.errors.website.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone_comercial">Telefone Comercial</Label>
                      <Input
                        id="telefone_comercial"
                        {...empresaForm.register('telefone_comercial')}
                        placeholder="(00) 00000-0000"
                        className="h-11"
                      />
                      {empresaForm.formState.errors.telefone_comercial && (
                        <p className="text-sm text-destructive">
                          {empresaForm.formState.errors.telefone_comercial.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => empresaForm.reset()}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={updatingEmpresa}>
                        {updatingEmpresa ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Alterar Senha */}
            <TabsContent value="senha" className="space-y-6">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription>Atualize sua senha de acesso</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={senhaForm.handleSubmit(handleUpdateSenha)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="senha_atual">Senha Atual *</Label>
                      <Input
                        id="senha_atual"
                        type="password"
                        {...senhaForm.register('senha_atual')}
                        className="h-11"
                      />
                      {senhaForm.formState.errors.senha_atual && (
                        <p className="text-sm text-destructive">
                          {senhaForm.formState.errors.senha_atual.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nova_senha">Nova Senha *</Label>
                      <Input
                        id="nova_senha"
                        type="password"
                        {...senhaForm.register('nova_senha')}
                        className="h-11"
                      />
                      {senhaForm.formState.errors.nova_senha && (
                        <p className="text-sm text-destructive">
                          {senhaForm.formState.errors.nova_senha.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Mínimo 8 caracteres, uma letra maiúscula, uma minúscula e um número
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmar_senha">Confirmar Nova Senha *</Label>
                      <Input
                        id="confirmar_senha"
                        type="password"
                        {...senhaForm.register('confirmar_senha')}
                        className="h-11"
                      />
                      {senhaForm.formState.errors.confirmar_senha && (
                        <p className="text-sm text-destructive">
                          {senhaForm.formState.errors.confirmar_senha.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => senhaForm.reset()}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={updatingSenha}>
                        {updatingSenha ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Alterando...
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Alterar Senha
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Avatar */}
            <TabsContent value="avatar" className="space-y-6">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Avatar da Empresa</CardTitle>
                  <CardDescription>Atualize a foto de perfil da sua empresa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={empresa?.nome_fantasia || empresa?.razao_social} />
                      <AvatarFallback className="text-2xl">
                        {(empresa?.nome_fantasia || empresa?.razao_social || 'E').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <Input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleUploadAvatar(file)
                            }
                          }}
                          disabled={uploadingAvatar}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          disabled={uploadingAvatar}
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                        >
                          {uploadingAvatar ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Escolher Imagem
                            </>
                          )}
                        </Button>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-2">
                        Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 2MB
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
