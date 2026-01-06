import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { GetCampanhasFilters } from '@/services/campanhaService'
import type { CampanhaStatus } from '@/types/database'

interface CampanhaFiltersProps {
  filters: GetCampanhasFilters
  onFiltersChange: (filters: GetCampanhasFilters) => void
  onClear: () => void
}

export function CampanhaFilters({ filters, onFiltersChange, onClear }: CampanhaFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={filters.status || '__all__'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value === '__all__' ? undefined : value })
          }
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            <SelectItem value="em_analise">Em Análise</SelectItem>
            <SelectItem value="aprovada">Aprovada</SelectItem>
            <SelectItem value="reprovada">Reprovada</SelectItem>
            <SelectItem value="ativa">Ativa</SelectItem>
            <SelectItem value="pausada">Pausada</SelectItem>
            <SelectItem value="finalizada">Finalizada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="data_inicio">Data Início</Label>
        <Input
          id="data_inicio"
          type="date"
          value={filters.data_inicio || ''}
          onChange={(e) => onFiltersChange({ ...filters, data_inicio: e.target.value || undefined })}
        />
      </div>
      <div>
        <Label htmlFor="data_fim">Data Fim</Label>
        <Input
          id="data_fim"
          type="date"
          value={filters.data_fim || ''}
          onChange={(e) => onFiltersChange({ ...filters, data_fim: e.target.value || undefined })}
        />
      </div>
      <div>
        <Label htmlFor="search">Buscar</Label>
        <div className="flex gap-2">
          <Input
            id="search"
            placeholder="Título ou descrição..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
          />
          {(filters.status || filters.data_inicio || filters.data_fim || filters.search) && (
            <Button variant="ghost" size="icon" onClick={onClear}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

