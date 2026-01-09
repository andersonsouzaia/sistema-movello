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
import { Loader2, Upload, Save, Lock, User, Car, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatCPF, formatPhone, formatPlaca } from '@/lib/utils/formatters'
import { validatePassword } from '@/lib/utils/validations'

const motoristaSchema = z.object({
  telefone: z.string().min(10, 'Telefone inválido'),
  rg: z.string().optional(),
  data_nascimento: z.string().optional(),
  modelo_veiculo: z.string().optional(),
  cor_veiculo: z.string().optional(),
  ano_veiculo: z.number().min(1900).max(new Date().getFullYear() + 1).optional().or(z.literal('')),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  pix: z.string().optional(),
}).refine((data) => {
  // Validar PIX se fornecido
  if (data.pix && data.pix.trim()) {
    // PIX pode ser CPF, email, telefone ou chave aleatória
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const telefoneRegex = /^\+?55\d{10,11}$/
    const cpfRegex = /^\d{11}$/
    const chaveAleatoriaRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    const pixLimpo = data.pix.replace(/[\s.-]/g, '')
    
    return emailRegex.test(data.pix) || 
           telefoneRegex.test(pixLimpo) || 
           cpfRegex.test(pixLimpo) || 
           chaveAleatoriaRegex.test(data.pix) ||
           pixLimpo.length >= 26 // Chave aleatória sem hífens
  }
  return true
}, {
  message: 'PIX inválido. Use CPF, email, telefone ou chave aleatória',
  path: ['pix'],
}).refine((data) => {
  // Validar agência se fornecida (4 dígitos)
  if (data.agencia && data.agencia.trim()) {
    const agenciaLimpa = data.agencia.replace(/\D/g, '')
    return agenciaLimpa.length === 4
  }
  return true
}, {
  message: 'Agência deve conter 4 dígitos',
  path: ['agencia'],
}).refine((data) => {
  // Validar conta se fornecida (mínimo 5 dígitos)
  if (data.conta && data.conta.trim()) {
    const contaLimpa = data.conta.replace(/\D/g, '')
    return contaLimpa.length >= 5 && contaLimpa.length <= 12
  }
  return true
}, {
  message: 'Conta deve conter entre 5 e 12 dígitos',
  path: ['conta'],
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

type MotoristaFormData = z.infer<typeof motoristaSchema>
type SenhaFormData = z.infer<typeof senhaSchema>

export default function MotoristaPerfil() {
  const { motorista, profile, refreshUser } = useAuth()
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [updatingMotorista, setUpdatingMotorista] = useState(false)
  const [updatingSenha, setUpdatingSenha] = useState(false)

  const motoristaForm = useForm<MotoristaFormData>({
    resolver: zodResolver(motoristaSchema),
    defaultValues: {
      telefone: motorista?.telefone || '',
      rg: motorista?.rg || '',
      data_nascimento: motorista?.data_nascimento ? motorista.data_nascimento.split('T')[0] : '',
      modelo_veiculo: motorista?.modelo_veiculo || '',
      cor_veiculo: motorista?.cor_veiculo || '',
      ano_veiculo: motorista?.ano_veiculo || undefined,
      banco: motorista?.banco || '',
      agencia: motorista?.agencia || '',
      conta: motorista?.conta || '',
      pix: motorista?.pix || '',
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

  // Reset form quando motorista carregar
  useEffect(() => {
    if (motorista) {
      motoristaForm.reset({
        telefone: motorista.telefone || '',
        rg: motorista.rg || '',
        data_nascimento: motorista.data_nascimento ? motorista.data_nascimento.split('T')[0] : '',
        modelo_veiculo: motorista.modelo_veiculo || '',
        cor_veiculo: motorista.cor_veiculo || '',
        ano_veiculo: motorista.ano_veiculo || undefined,
        banco: motorista.banco || '',
        agencia: motorista.agencia || '',
        conta: motorista.conta || '',
        pix: motorista.pix || '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motorista])

  const handleUpdateMotorista = async (data: MotoristaFormData) => {
    if (!motorista?.id) {
      toast.error('Motorista não encontrado')
      return
    }

    setUpdatingMotorista(true)
    try {
      const { error } = await supabase
        .from('motoristas')
        .update({
          telefone: data.telefone,
          rg: data.rg || null,
          data_nascimento: data.data_nascimento ? new Date(data.data_nascimento).toISOString() : null,
          modelo_veiculo: data.modelo_veiculo || null,
          cor_veiculo: data.cor_veiculo || null,
          ano_veiculo: data.ano_veiculo || null,
          banco: data.banco || null,
          agencia: data.agencia || null,
          conta: data.conta || null,
          pix: data.pix || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', motorista.id)

      if (error) {
        throw error
      }

      toast.success('Dados atualizados com sucesso!')
      refreshUser()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar dados'
      toast.error(errorMessage)
      console.error('Erro ao atualizar motorista:', error)
    } finally {
      setUpdatingMotorista(false)
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
    if (!motorista?.id || !profile?.id) {
      toast.error('Motorista não encontrado')
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
      const fileName = `${motorista.id}/avatar.${fileExt}`
      const filePath = `motoristas/${fileName}`

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
    <ProtectedRoute requiredUserType="motorista">
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
              Edite seus dados pessoais e do veículo
            </p>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="dados" className="space-y-6">
            <TabsList>
              <TabsTrigger value="dados">
                <User className="h-4 w-4 mr-2" />
                Dados Pessoais
              </TabsTrigger>
              <TabsTrigger value="veiculo">
                <Car className="h-4 w-4 mr-2" />
                Veículo
              </TabsTrigger>
              <TabsTrigger value="pagamento">
                <CreditCard className="h-4 w-4 mr-2" />
                Dados Bancários
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

            {/* Tab: Dados Pessoais */}
            <TabsContent value="dados" className="space-y-6">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>Seus dados pessoais cadastrados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome</Label>
                      <Input
                        id="nome"
                        value={profile?.nome || ''}
                        disabled
                        className="h-11 bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Nome não pode ser alterado
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={profile?.email || ''}
                        disabled
                        className="h-11 bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email não pode ser alterado
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={motorista?.cpf ? formatCPF(motorista.cpf) : ''}
                        disabled
                        className="h-11 bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        CPF não pode ser alterado
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone *</Label>
                      <Input
                        id="telefone"
                        {...motoristaForm.register('telefone')}
                        placeholder="(00) 00000-0000"
                        className="h-11"
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value)
                          motoristaForm.setValue('telefone', formatted)
                        }}
                      />
                      {motoristaForm.formState.errors.telefone && (
                        <p className="text-sm text-destructive">
                          {motoristaForm.formState.errors.telefone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="rg">RG</Label>
                      <Input
                        id="rg"
                        {...motoristaForm.register('rg')}
                        placeholder="00.000.000-0"
                        className="h-11"
                      />
                      {motoristaForm.formState.errors.rg && (
                        <p className="text-sm text-destructive">
                          {motoristaForm.formState.errors.rg.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                      <Input
                        id="data_nascimento"
                        type="date"
                        {...motoristaForm.register('data_nascimento')}
                        className="h-11"
                        max={new Date().toISOString().split('T')[0]}
                      />
                      {motoristaForm.formState.errors.data_nascimento && (
                        <p className="text-sm text-destructive">
                          {motoristaForm.formState.errors.data_nascimento.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => motoristaForm.reset()}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="button"
                      onClick={motoristaForm.handleSubmit(handleUpdateMotorista)}
                      disabled={updatingMotorista}
                    >
                      {updatingMotorista ? (
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Veículo */}
            <TabsContent value="veiculo" className="space-y-6">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Informações do Veículo</CardTitle>
                  <CardDescription>Dados do seu veículo cadastrado</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={motoristaForm.handleSubmit(handleUpdateMotorista)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="veiculo">Tipo de Veículo</Label>
                        <Input
                          id="veiculo"
                          value={motorista?.veiculo || ''}
                          disabled
                          className="h-11 bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Tipo não pode ser alterado
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="placa">Placa</Label>
                        <Input
                          id="placa"
                          value={motorista?.placa ? formatPlaca(motorista.placa) : ''}
                          disabled
                          className="h-11 bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Placa não pode ser alterada
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="modelo_veiculo">Modelo</Label>
                        <Input
                          id="modelo_veiculo"
                          {...motoristaForm.register('modelo_veiculo')}
                          placeholder="Ex: Corolla"
                          className="h-11"
                        />
                        {motoristaForm.formState.errors.modelo_veiculo && (
                          <p className="text-sm text-destructive">
                            {motoristaForm.formState.errors.modelo_veiculo.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cor_veiculo">Cor</Label>
                        <Input
                          id="cor_veiculo"
                          {...motoristaForm.register('cor_veiculo')}
                          placeholder="Ex: Branco"
                          className="h-11"
                        />
                        {motoristaForm.formState.errors.cor_veiculo && (
                          <p className="text-sm text-destructive">
                            {motoristaForm.formState.errors.cor_veiculo.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ano_veiculo">Ano</Label>
                        <Input
                          id="ano_veiculo"
                          type="number"
                          {...motoristaForm.register('ano_veiculo', { valueAsNumber: true })}
                          placeholder="Ex: 2020"
                          className="h-11"
                        />
                        {motoristaForm.formState.errors.ano_veiculo && (
                          <p className="text-sm text-destructive">
                            {motoristaForm.formState.errors.ano_veiculo.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => motoristaForm.reset()}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={updatingMotorista}>
                        {updatingMotorista ? (
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

            {/* Tab: Dados Bancários */}
            <TabsContent value="pagamento" className="space-y-6">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Dados Bancários</CardTitle>
                  <CardDescription>Configure seus dados para recebimento</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={motoristaForm.handleSubmit(handleUpdateMotorista)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="banco">Banco</Label>
                        <Input
                          id="banco"
                          {...motoristaForm.register('banco')}
                          placeholder="Ex: Banco do Brasil"
                          className="h-11"
                        />
                        {motoristaForm.formState.errors.banco && (
                          <p className="text-sm text-destructive">
                            {motoristaForm.formState.errors.banco.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="agencia">Agência</Label>
                        <Input
                          id="agencia"
                          {...motoristaForm.register('agencia')}
                          placeholder="0000"
                          className="h-11"
                        />
                        {motoristaForm.formState.errors.agencia && (
                          <p className="text-sm text-destructive">
                            {motoristaForm.formState.errors.agencia.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="conta">Conta</Label>
                        <Input
                          id="conta"
                          {...motoristaForm.register('conta')}
                          placeholder="00000-0"
                          className="h-11"
                        />
                        {motoristaForm.formState.errors.conta && (
                          <p className="text-sm text-destructive">
                            {motoristaForm.formState.errors.conta.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pix">Chave PIX</Label>
                        <Input
                          id="pix"
                          {...motoristaForm.register('pix')}
                          placeholder="CPF, email ou chave aleatória"
                          className="h-11"
                        />
                        {motoristaForm.formState.errors.pix && (
                          <p className="text-sm text-destructive">
                            {motoristaForm.formState.errors.pix.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Configure pelo menos uma forma de recebimento. PIX pode ser CPF, email, telefone ou chave aleatória.
                        </p>
                        {motoristaForm.formState.errors.pix && (
                          <p className="text-sm text-destructive">
                            {motoristaForm.formState.errors.pix.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => motoristaForm.reset()}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={updatingMotorista}>
                        {updatingMotorista ? (
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
                  <CardTitle>Foto de Perfil</CardTitle>
                  <CardDescription>Atualize sua foto de perfil</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.nome || 'Motorista'} />
                      <AvatarFallback className="text-2xl">
                        {(profile?.nome || 'M').charAt(0).toUpperCase()}
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

