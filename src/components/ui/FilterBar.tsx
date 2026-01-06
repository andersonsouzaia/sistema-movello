import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterOption {
  key: string
  label: string
  type: 'select' | 'search'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
}

interface FilterBarProps {
  filters: FilterOption[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  onClear?: () => void
  className?: string
}

export function FilterBar({
  filters,
  values,
  onChange,
  onClear,
  className,
}: FilterBarProps) {
  const hasActiveFilters = Object.values(values).some((v) => v !== '')

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex flex-wrap gap-4 items-end', className)}
    >
      {filters.map((filter) => {
        if (filter.type === 'search') {
          return (
            <div key={filter.key} className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={filter.placeholder || 'Buscar...'}
                  value={values[filter.key] || ''}
                  onChange={(e) => onChange(filter.key, e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
          )
        }

        return (
          <Select
            key={filter.key}
            value={values[filter.key] || '__all__'}
            onValueChange={(value) => {
              // Converter '__all__' para string vazia para limpar o filtro
              onChange(filter.key, value === '__all__' ? '' : value)
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-11">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      })}

      {hasActiveFilters && onClear && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="h-11"
        >
          <X className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      )}
    </motion.div>
  )
}

