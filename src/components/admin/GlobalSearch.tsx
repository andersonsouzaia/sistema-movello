import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { campanhaService } from '@/services/campanhaService'
import { ticketService } from '@/services/ticketService'
import { userService } from '@/services/userService'
import { supabase } from '@/lib/supabase'
import { Building2, Car, Megaphone, LifeBuoy, User, Search, DollarSign, Clock, X } from 'lucide-react'
import { formatCNPJ, formatCPF, formatCurrency } from '@/lib/utils/formatters'
import { pagamentoService } from '@/services/pagamentoService'

// Componente de busca global

interface SearchResult {
  id: string
  tipo: 'usuario' | 'empresa' | 'motorista' | 'campanha' | 'ticket' | 'pagamento'
  titulo: string
  subtitulo?: string
  link: string
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SEARCH_HISTORY_KEY = 'global_search_history'
const MAX_HISTORY_ITEMS = 10

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Carregar histórico de buscas
  useEffect(() => {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (history) {
      try {
        setSearchHistory(JSON.parse(history))
      } catch (e) {
        console.error('Erro ao carregar histórico de buscas:', e)
      }
    }
  }, [])

  // Salvar histórico de buscas
  const saveToHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) return
    
    setSearchHistory((prev) => {
      const updated = [searchQuery, ...prev.filter((q) => q !== searchQuery)].slice(0, MAX_HISTORY_ITEMS)
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setSearchHistory([])
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  }, [])

  // Buscar dados apenas quando necessário (modal aberto e query >= 2 caracteres)
  const empresasRef = useRef<any[]>([])
  const motoristasRef = useRef<any[]>([])
  const campanhasRef = useRef<any[]>([])
  const ticketsRef = useRef<any[]>([])
  const usersRef = useRef<any[]>([])
  const pagamentosRef = useRef<any[]>([])
  const dataLoadedRef = useRef(false)

  // Carregar dados apenas uma vez quando o modal abrir pela primeira vez
  useEffect(() => {
    if (open && !dataLoadedRef.current) {
      const loadData = async () => {
        try {
          const [empresasData, motoristasData, campanhasData, ticketsData, usersData, pagamentosData] = await Promise.all([
            supabase.from('empresas').select('*').limit(100).then(r => r.data || []),
            supabase.from('motoristas').select('*').limit(100).then(r => r.data || []),
            campanhaService.getCampanhas({}).catch(() => []),
            ticketService.getTickets({}).catch(() => []),
            userService.getUsersWithRoles().catch(() => []),
            supabase.from('pagamentos').select('*').limit(100).then(r => r.data || []),
          ])
          empresasRef.current = empresasData
          motoristasRef.current = motoristasData
          campanhasRef.current = campanhasData
          ticketsRef.current = ticketsData
          usersRef.current = usersData
          pagamentosRef.current = pagamentosData
          dataLoadedRef.current = true
        } catch (error) {
          console.error('Erro ao carregar dados para busca:', error)
        }
      }
      loadData()
    }
  }, [open])

  // Debounce da busca
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!query.trim() || query.length < 2) {
      setResults([])
      setSelectedIndex(-1)
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query])

  const performSearch = useCallback((searchQuery: string) => {
    setLoading(true)
    const searchLower = searchQuery.toLowerCase()

    const searchResults: SearchResult[] = []

    // Buscar usuários
    usersRef.current
      .filter(
        (user) =>
          user.nome?.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      )
      .slice(0, 5)
      .forEach((user) => {
        searchResults.push({
          id: user.id,
          tipo: 'usuario',
          titulo: user.nome || user.email,
          subtitulo: user.email,
          link: `/admin/roles`,
        })
      })

    // Buscar empresas
    empresasRef.current
      .filter(
        (empresa) =>
          empresa.razao_social.toLowerCase().includes(searchLower) ||
          empresa.cnpj.includes(query.replace(/\D/g, ''))
      )
      .slice(0, 5)
      .forEach((empresa) => {
        searchResults.push({
          id: empresa.id,
          tipo: 'empresa',
          titulo: empresa.razao_social,
          subtitulo: formatCNPJ(empresa.cnpj),
          link: `/admin/empresas/${empresa.id}`,
        })
      })

    // Buscar motoristas
    motoristasRef.current
      .filter(
        (motorista) =>
          motorista.user_nome?.toLowerCase().includes(searchLower) ||
          motorista.cpf.includes(query.replace(/\D/g, ''))
      )
      .slice(0, 5)
      .forEach((motorista) => {
        searchResults.push({
          id: motorista.id,
          tipo: 'motorista',
          titulo: motorista.user_nome || 'Motorista',
          subtitulo: formatCPF(motorista.cpf),
          link: `/admin/motoristas/${motorista.id}`,
        })
      })

    // Buscar campanhas
    campanhasRef.current
      .filter(
        (campanha) =>
          campanha.titulo.toLowerCase().includes(searchLower) ||
          campanha.descricao?.toLowerCase().includes(searchLower)
      )
      .slice(0, 5)
      .forEach((campanha) => {
        searchResults.push({
          id: campanha.id,
          tipo: 'campanha',
          titulo: campanha.titulo,
          subtitulo: campanha.empresa?.razao_social,
          link: `/admin/campanhas/${campanha.id}`,
        })
      })

    // Buscar tickets
    ticketsRef.current
      .filter(
        (ticket) =>
          ticket.titulo.toLowerCase().includes(searchLower) ||
          ticket.descricao.toLowerCase().includes(searchLower)
      )
      .slice(0, 5)
      .forEach((ticket) => {
        searchResults.push({
          id: ticket.id,
          tipo: 'ticket',
          titulo: ticket.titulo,
          subtitulo: `#${ticket.id.slice(0, 8)}`,
          link: `/admin/suporte/${ticket.id}`,
        })
      })

    // Buscar pagamentos
    pagamentosRef.current
      .filter(
        (pagamento) =>
          pagamento.referencia_externa?.toLowerCase().includes(searchLower) ||
          pagamento.id.toLowerCase().includes(searchLower)
      )
      .slice(0, 5)
      .forEach((pagamento) => {
        searchResults.push({
          id: pagamento.id,
          tipo: 'pagamento',
          titulo: `Pagamento ${pagamento.referencia_externa || pagamento.id.slice(0, 8)}`,
          subtitulo: formatCurrency(pagamento.valor),
          link: `/admin/pagamentos`,
        })
      })

    setResults(searchResults.slice(0, 10))
    setSelectedIndex(-1)
    setLoading(false)
  }, [])

  // Navegação por teclado
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, -1))
      } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
        e.preventDefault()
        handleSelect(results[selectedIndex])
      } else if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, results, selectedIndex, onOpenChange])

  const tipoIcons = {
    usuario: User,
    empresa: Building2,
    motorista: Car,
    campanha: Megaphone,
    ticket: LifeBuoy,
    pagamento: DollarSign,
  }

  const tipoLabels = {
    usuario: 'Usuário',
    empresa: 'Empresa',
    motorista: 'Motorista',
    campanha: 'Campanha',
    ticket: 'Ticket',
    pagamento: 'Pagamento',
  }

  const handleSelect = (result: SearchResult) => {
    saveToHistory(query)
    navigate(result.link)
    onOpenChange(false)
    setQuery('')
    setSelectedIndex(-1)
  }

  const handleHistorySelect = (historyQuery: string) => {
    setQuery(historyQuery)
    inputRef.current?.focus()
  }

  // Sugestões baseadas no histórico e dados recentes
  const suggestions = useMemo(() => {
    if (query.length < 2) return []
    
    const searchLower = query.toLowerCase()
    const suggestionsList: string[] = []
    
    // Adicionar histórico relevante
    searchHistory
      .filter((h) => h.toLowerCase().includes(searchLower))
      .slice(0, 3)
      .forEach((h) => suggestionsList.push(h))
    
    // Adicionar sugestões de empresas recentes
    empresasRef.current
      .filter((e) => e.razao_social.toLowerCase().includes(searchLower))
      .slice(0, 2)
      .forEach((e) => suggestionsList.push(e.razao_social))
    
    return [...new Set(suggestionsList)].slice(0, 5)
  }, [query, searchHistory])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Buscar usuários, empresas, campanhas, tickets..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>
          
          {/* Sugestões */}
          {suggestions.length > 0 && query.length >= 2 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Sugestões:</span>
              {suggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => handleHistorySelect(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : query.length === 0 && searchHistory.length > 0 ? (
            <div className="divide-y">
              <div className="p-3 flex items-center justify-between border-b">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Histórico de Buscas
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={clearHistory}
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              </div>
              {searchHistory.slice(0, 5).map((historyItem, idx) => (
                <div
                  key={idx}
                  className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleHistorySelect(historyItem)}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{historyItem}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 && query.length >= 2 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum resultado encontrado
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Digite pelo menos 2 caracteres para buscar
            </div>
          ) : (
            <div className="divide-y">
              {results.map((result, idx) => {
                const Icon = tipoIcons[result.tipo]
                const isSelected = idx === selectedIndex
                return (
                  <div
                    key={`${result.tipo}-${result.id}`}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">{result.titulo}</p>
                          <Badge variant="outline" className="text-xs">
                            {tipoLabels[result.tipo]}
                          </Badge>
                        </div>
                        {result.subtitulo && (
                          <p className="text-xs text-muted-foreground truncate">{result.subtitulo}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="p-2 border-t text-xs text-muted-foreground text-center">
          Pressione ESC para fechar • Use ↑↓ para navegar • Enter para selecionar
        </div>
      </DialogContent>
    </Dialog>
  )
}

