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
import { Card } from '@/components/ui/card'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

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
  manualPagination?: boolean
  pageCount?: number
  rowCount?: number
  onPageChange?: (page: number) => void
  onSearch?: (term: string) => void
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
  manualPagination = false,
  pageCount: manualPageCount,
  rowCount: manualRowCount,
  onPageChange,
  onSearch,
}: DataTableProps<T>) {
  const isMobile = useIsMobile()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  // Debounce da busca
  useEffect(() => {
    // Cleanup previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      if (onSearch) {
        onSearch(search)
      }
      if (!manualPagination) {
        setCurrentPage(1) // Reset para primeira página ao buscar localmente
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [search, manualPagination, onSearch])

  // Filtrar dados (apenas se não for paginação manual)
  const filteredData = useMemo(() => {
    if (manualPagination) return data

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
  }, [data, debouncedSearch, searchKey, filters, filterValues, manualPagination])

  // Paginação
  const totalPages = manualPagination
    ? (manualPageCount || 1)
    : Math.ceil(filteredData.length / pageSize)

  const startIndex = manualPagination
    ? (currentPage - 1) * pageSize
    : (currentPage - 1) * pageSize

  const endIndex = manualPagination
    ? startIndex + data.length
    : startIndex + pageSize

  const paginatedData = manualPagination
    ? data
    : filteredData.slice(startIndex, endIndex)

  const totalRecords = manualPagination
    ? (manualRowCount || 0)
    : filteredData.length

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    if (onPageChange) {
      onPageChange(newPage)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }))
    if (!manualPagination) {
      setCurrentPage(1)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (!manualPagination) {
      setCurrentPage(1)
    }
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

      {/* Tabela / Cards Mobile */}
      {isMobile ? (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            paginatedData.map((row, index) => (
              <Card
                key={index}
                className={cn(
                  "p-4 cursor-pointer hover:shadow-md transition-shadow",
                  onRowClick && "hover:bg-muted/50"
                )}
                onClick={() => onRowClick?.(row)}
              >
                <div className="space-y-3">
                  {columns.map((column) => {
                    const content = column.render
                      ? column.render(row)
                      : column.accessor
                        ? column.accessor(row)
                        : row[column.key]

                    // Não mostrar coluna de ações como campo separado em mobile
                    if (column.key === 'actions') {
                      return (
                        <div key={column.key} className="pt-2 border-t">
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            {column.header}
                          </div>
                          <div>{content}</div>
                        </div>
                      )
                    }

                    return (
                      <div key={column.key}>
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          {column.header}
                        </div>
                        <div className="text-sm">{content}</div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
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
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Mostrando {manualPagination ? startIndex + 1 : startIndex + 1} a {manualPagination ? Math.min(startIndex + data.length, totalRecords) : Math.min(endIndex, filteredData.length)} de {manualPagination ? totalRecords : filteredData.length} resultados
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
                      onClick={() => handlePageChange(page)}
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
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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

