import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { useAuth } from '@/contexts/AuthContext'
import { useUsers, useCreateUser, useUpdateUserRole } from '@/hooks/useUsers'
import { userService } from '@/services/userService'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { UserForm } from '@/components/admin/UserForm'
import { UserTable } from '@/components/admin/UserTable'
import { Loader2, UserCog, Shield, Users, UserPlus, Edit, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import type { Role, Permission, RoleSlug } from '@/types/database'
import type { CreateUserFormData, UpdateUserRoleFormData } from '@/types/database'

export default function AdminRoles() {
  const { user, roles: userRoles } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [editRoleOpen, setEditRoleOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedRoleSlug, setSelectedRoleSlug] = useState<RoleSlug>('admin')
  
  const { users, loading: usersLoading, refetch: refetchUsers } = useUsers({})
  const { createUser, loading: createLoading } = useCreateUser()
  const { updateRole, loading: updateLoading } = useUpdateUserRole()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Buscar roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('*')
          .order('name')

        if (!rolesError && rolesData) {
          setRoles(rolesData)
        }

        // Buscar permissões
        const { data: permsData, error: permsError } = await supabase
          .from('permissions')
          .select('*')
          .order('resource', { ascending: true })
          .order('action', { ascending: true })

        if (!permsError && permsData) {
          setPermissions(permsData)
        }
      } catch (error) {
        console.error('Erro ao buscar roles e permissões:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const permissionsByResource = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = []
    }
    acc[perm.resource].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  const handleCreateUser = async (data: CreateUserFormData) => {
    if (!user?.id) return

    const result = await createUser.createUser(data, user.id)
    if (result.success) {
      setCreateUserOpen(false)
      refetchUsers()
    }
  }

  const handleEditRole = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (user && user.roles.length > 0) {
      setSelectedRoleSlug(user.roles[0].slug)
    }
    setSelectedUserId(userId)
    setEditRoleOpen(true)
  }

  const handleUpdateRole = async () => {
    if (!selectedUserId || !user?.id) return

    const result = await updateRole.updateRole(
      {
        user_id: selectedUserId,
        role_slug: selectedRoleSlug,
        is_primary: true,
      },
      user.id
    )

    if (result.success) {
      setEditRoleOpen(false)
      setSelectedUserId(null)
      refetchUsers()
    }
  }

  const handleResetPassword = async (userId: string) => {
    if (!user?.id) return

    const result = await userService.resetUserPassword(userId, user.id)
    if (result.success) {
      refetchUsers()
    }
  }

  const handleBlock = async (userId: string) => {
    if (!user?.id) return

    const motivo = prompt('Informe o motivo do bloqueio:')
    if (!motivo) return

    const result = await userService.blockUser(userId, motivo, user.id)
    if (result.success) {
      refetchUsers()
    }
  }

  // Agrupar usuários por role
  const usersByRole = roles.reduce((acc, role) => {
    acc[role.slug] = users.filter((user) => user.roles.some((r) => r.slug === role.slug))
    return acc
  }, {} as Record<string, typeof users>)

  return (
    <ProtectedRoute requiredUserType="admin">
      <RequirePermission permission="users.manage_roles">
        <DashboardLayout>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                Roles e Usuários
              </h1>
              <p className="text-lg text-muted-foreground">
                Gerencie roles, permissões e usuários do sistema
              </p>
            </motion.div>

            <Tabs defaultValue="roles" className="space-y-6">
              <TabsList>
                <TabsTrigger value="roles">
                  <Shield className="mr-2 h-4 w-4" />
                  Roles e Permissões
                </TabsTrigger>
                <TabsTrigger value="users">
                  <Users className="mr-2 h-4 w-4" />
                  Gestão de Usuários
                </TabsTrigger>
                <TabsTrigger value="associations">
                  <UserCog className="mr-2 h-4 w-4" />
                  Associações
                </TabsTrigger>
              </TabsList>

              {/* Aba 1: Roles e Permissões */}
              <TabsContent value="roles">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <Card className="card-premium">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <UserCog className="h-5 w-5" />
                            Roles do Sistema
                          </CardTitle>
                          <CardDescription>
                            {roles.length} role(s) cadastrada(s)
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {roles.map((role) => (
                              <div
                                key={role.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card"
                              >
                                <div>
                                  <p className="font-medium">{role.name}</p>
                                  {role.description && (
                                    <p className="text-xs text-muted-foreground">{role.description}</p>
                                  )}
                                </div>
                                {role.is_system && <Badge variant="secondary">Sistema</Badge>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      <Card className="card-premium">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Permissões do Sistema
                          </CardTitle>
                          <CardDescription>
                            {permissions.length} permissão(ões) cadastrada(s)
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4 max-h-[600px] overflow-y-auto">
                            {Object.entries(permissionsByResource).map(([resource, perms]) => (
                              <div key={resource}>
                                <h4 className="font-semibold text-sm mb-2 capitalize">{resource}</h4>
                                <div className="space-y-2 pl-4">
                                  {perms.map((perm) => (
                                    <div
                                      key={perm.id}
                                      className="flex items-center justify-between p-2 rounded border bg-muted/30"
                                    >
                                      <div>
                                        <p className="text-sm font-medium">{perm.name}</p>
                                        <p className="text-xs text-muted-foreground">{perm.slug}</p>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {perm.action}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                )}
              </TabsContent>

              {/* Aba 2: Gestão de Usuários */}
              <TabsContent value="users">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">Usuários do Sistema</h2>
                      <p className="text-muted-foreground">
                        Gerencie todos os usuários e suas roles
                      </p>
                    </div>
                    <Button onClick={() => setCreateUserOpen(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Criar Usuário
                    </Button>
                  </div>

                  <UserTable
                    users={users}
                    loading={usersLoading}
                    onEditRole={handleEditRole}
                    onResetPassword={handleResetPassword}
                    onBlock={handleBlock}
                  />
                </motion.div>
              </TabsContent>

              {/* Aba 3: Associações Role-Usuário */}
              <TabsContent value="associations">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">Associações Role-Usuário</h2>
                    <p className="text-muted-foreground">
                      Visualize e gerencie quais usuários pertencem a cada role
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {roles.map((role) => {
                      const roleUsers = usersByRole[role.slug] || []
                      return (
                        <Card key={role.id} className="card-premium">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  {role.name}
                                  {role.is_system && <Badge variant="secondary">Sistema</Badge>}
                                </CardTitle>
                                <CardDescription>
                                  {roleUsers.length} usuário(s) com esta role
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {roleUsers.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Nenhum usuário com esta role</p>
                            ) : (
                              <div className="space-y-2">
                                {roleUsers.map((user) => (
                                  <div
                                    key={user.id}
                                    className="flex items-center justify-between p-2 rounded border bg-muted/30"
                                  >
                                    <div>
                                      <p className="text-sm font-medium">{user.nome || 'Sem nome'}</p>
                                      <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                    <Badge variant={user.status === 'ativo' ? 'default' : 'secondary'}>
                                      {user.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>

            {/* Dialog de Criar Usuário */}
            <UserForm
              open={createUserOpen}
              onOpenChange={setCreateUserOpen}
              onSubmit={handleCreateUser}
              roles={roles.map((r) => ({ slug: r.slug, name: r.name }))}
              loading={createLoading}
            />

            {/* Dialog de Editar Role */}
            <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Role do Usuário</DialogTitle>
                  <DialogDescription>
                    Selecione a nova role para este usuário
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Role</Label>
                    <Select value={selectedRoleSlug} onValueChange={(value) => setSelectedRoleSlug(value as RoleSlug)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.slug}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditRoleOpen(false)} disabled={updateLoading}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateRole} disabled={updateLoading}>
                    {updateLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      'Atualizar Role'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </DashboardLayout>
      </RequirePermission>
    </ProtectedRoute>
  )
}

