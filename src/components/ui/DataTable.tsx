import { ReactNode, useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  accessor?: (row: T) => ReactNode
  render?: (row: T) => ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchKey?: string
  searchKeys?: string[] // Suporte para múltiplas chaves de busca
  searchPlaceholder?: string
  filters?: Array<{
    key: string
    label: string
    options: Array<{ value: string; label: string }>
  }>
  onRowClick?: (row: T) => void
  emptyMessage?: string
  loading?: boolean
  pageSize?: number
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey,
  searchKeys,
  searchPlaceholder = 'Buscar...',
  filters = [],
  onRowClick,
  emptyMessage = 'Nenhum registro encontrado',
  loading = false,
  pageSize = 10,
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce da busca
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1) // Reset para primeira página ao buscar
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [search])

  // Filtrar dados
  const filteredData = useMemo(() => {
    let result = [...data]

    // Busca - suporte para múltiplas chaves ou chave única
    if (debouncedSearch && (searchKey || searchKeys)) {
      const searchLower = debouncedSearch.toLowerCase()
      const keysToSearch = searchKeys || (searchKey ? [searchKey] : [])
      
      result = result.filter((row) => {
        // Buscar em todas as chaves especificadas
        return keysToSearch.some((key) => {
          const value = row[key]
          if (value === null || value === undefined) return false
          return value.toString().toLowerCase().includes(searchLower)
        })
      })
    }

    // Filtros
    filters.forEach((filter) => {
      const filterValue = filterValues[filter.key]
      // Ignorar valores vazios ou '__all__' (todos)
      if (filterValue && filterValue !== '__all__') {
        result = result.filter((row) => {
          const value = row[filter.key]
          return value?.toString() === filterValue
        })
      }
    })

    return result
  }, [data, debouncedSearch, searchKey, filters, filterValues])

  // Paginação
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredData.slice(startIndex, endIndex)

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Barra de busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        {(searchKey || searchKeys) && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        )}

        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={filterValues[filter.key] || '__all__'}
            onValueChange={(value) => {
              // Converter '__all__' para string vazia para limpar o filtro
              handleFilterChange(filter.key, value === '__all__' ? '' : value)
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-11">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      {/* Tabela */}
      <div className="card-premium rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b">
                {columns.map((column) => (
                  <TableHead key={column.key} className="font-semibold">
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={index}
                    className={cn(
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.render
                          ? column.render(row)
                          : column.accessor
                          ? column.accessor(row)
                          : row[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredData.length)} de {filteredData.length} resultados
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 7) return true
                  if (page === 1 || page === totalPages) return true
                  if (Math.abs(page - currentPage) <= 1) return true
                  return false
                })
                .map((page, index, array) => (
                  <div key={page} className="flex items-center gap-1">
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  </div>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

