import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Role, Permission } from '@/types/database'

interface RolePermissionsEditorProps {
  roleId: string
  onSave?: () => void
}

export function RolePermissionsEditor({ roleId, onSave }: RolePermissionsEditorProps) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Buscar todas as permissões
        const { data: permsData, error: permsError } = await supabase
          .from('permissions')
          .select('*')
          .order('resource', { ascending: true })
          .order('action', { ascending: true })

        if (permsError) throw permsError

        // Buscar permissões da role
        const { data: rolePermsData, error: rolePermsError } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', roleId)

        if (rolePermsError) throw rolePermsError

        setPermissions(permsData || [])
        setSelectedPermissions(new Set((rolePermsData || []).map((rp) => rp.permission_id)))
      } catch (error) {
        console.error('Erro ao buscar permissões:', error)
        toast.error('Erro ao carregar permissões')
      } finally {
        setLoading(false)
      }
    }

    if (roleId) {
      fetchData()
    }
  }, [roleId])

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId)
      } else {
        newSet.add(permissionId)
      }
      return newSet
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Remover todas as permissões atuais
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)

      if (deleteError) throw deleteError

      // Adicionar permissões selecionadas
      if (selectedPermissions.size > 0) {
        const rolePerms = Array.from(selectedPermissions).map((permId) => ({
          role_id: roleId,
          permission_id: permId,
        }))

        const { error: insertError } = await supabase.from('role_permissions').insert(rolePerms)

        if (insertError) throw insertError
      }

      toast.success('Permissões atualizadas com sucesso!')
      onSave?.()
    } catch (error) {
      console.error('Erro ao salvar permissões:', error)
      toast.error('Erro ao salvar permissões')
    } finally {
      setSaving(false)
    }
  }

  const permissionsByResource = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = []
    }
    acc[perm.resource].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  if (loading) {
    return (
      <Card className="card-premium">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-premium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Permissões da Role</CardTitle>
            <CardDescription>
              Selecione as permissões que esta role deve ter
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-h-[600px] overflow-y-auto">
          {Object.entries(permissionsByResource).map(([resource, perms]) => (
            <div key={resource}>
              <h4 className="font-semibold text-sm mb-3 capitalize flex items-center gap-2">
                {resource}
                <Badge variant="outline" className="text-xs">
                  {perms.length}
                </Badge>
              </h4>
              <div className="space-y-2 pl-4">
                {perms.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`perm-${perm.id}`}
                      checked={selectedPermissions.has(perm.id)}
                      onCheckedChange={() => handleTogglePermission(perm.id)}
                    />
                    <label
                      htmlFor={`perm-${perm.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{perm.name}</p>
                          <p className="text-xs text-muted-foreground">{perm.slug}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {perm.action}
                        </Badge>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

