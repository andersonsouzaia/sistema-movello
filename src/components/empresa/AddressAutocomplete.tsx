import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Loader2, MapPin, Clock, X } from 'lucide-react'
import { buscarEnderecosAutocomplete, type AddressSuggestion } from '@/utils/geocoding'
import { cn } from '@/lib/utils'

const HISTORY_KEY = 'movello_address_history'
const MAX_HISTORY = 10

interface AddressHistoryItem {
  display_name: string
  lat: number
  lng: number
  timestamp: number
}

interface AddressAutocompleteProps {
  value?: string
  onSelect: (address: AddressSuggestion) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function AddressAutocomplete({
  value = '',
  onSelect,
  placeholder = 'Digite um endereço...',
  className,
  disabled = false,
}: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<AddressHistoryItem[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AddressHistoryItem[]
        setHistory(parsed.slice(0, MAX_HISTORY))
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de endereços:', error)
    }
  }, [])

  // Buscar sugestões com debounce
  const buscarSugestoes = useCallback(async (query: string) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      const resultados = await buscarEnderecosAutocomplete(query.trim(), 5)
      setSuggestions(resultados)
    } catch (error) {
      console.error('Erro ao buscar endereços:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce na busca
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (inputValue.trim().length >= 3) {
      timeoutRef.current = setTimeout(() => {
        buscarSugestoes(inputValue)
      }, 300)
    } else {
      setSuggestions([])
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [inputValue, buscarSugestoes])

  const handleSelect = useCallback((address: AddressSuggestion) => {
    setInputValue(address.display_name)
    setOpen(false)
    setSuggestions([])
    
    // Salvar no histórico
    const newHistoryItem: AddressHistoryItem = {
      display_name: address.display_name,
      lat: address.lat,
      lng: address.lng,
      timestamp: Date.now(),
    }
    
    setHistory((prevHistory) => {
      const updatedHistory = [
        newHistoryItem,
        ...prevHistory.filter(h => h.display_name !== address.display_name),
      ].slice(0, MAX_HISTORY)
      
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory))
      } catch (error) {
        console.error('Erro ao salvar histórico:', error)
      }
      
      return updatedHistory
    })
    
    onSelect(address)
  }, [onSelect])

  const handleClear = useCallback(() => {
    setInputValue('')
    setSuggestions([])
    setOpen(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleHistorySelect = useCallback((item: AddressHistoryItem) => {
    handleSelect({
      display_name: item.display_name,
      lat: item.lat,
      lng: item.lng,
    })
  }, [handleSelect])

  const mostrarHistorico = !inputValue || inputValue.trim().length < 3
  const temResultados = suggestions.length > 0 || (mostrarHistorico && history.length > 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-10"
          />
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleClear}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandInput 
            value={inputValue} 
            onValueChange={setInputValue}
            placeholder="Buscar endereço..."
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
              </div>
            )}
            
            {!loading && mostrarHistorico && history.length > 0 && (
              <CommandGroup heading="Endereços Recentes">
                {history.map((item, index) => (
                  <CommandItem
                    key={`history-${index}-${item.timestamp}`}
                    value={item.display_name}
                    onSelect={() => handleHistorySelect(item)}
                    className="cursor-pointer"
                  >
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{item.display_name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {!loading && !mostrarHistorico && suggestions.length > 0 && (
              <CommandGroup heading="Sugestões">
                {suggestions.map((suggestion, index) => (
                  <CommandItem
                    key={`suggestion-${index}-${suggestion.place_id || index}`}
                    value={suggestion.display_name}
                    onSelect={() => handleSelect(suggestion)}
                    className="cursor-pointer"
                  >
                    <MapPin className="mr-2 h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">{suggestion.display_name}</div>
                      {suggestion.address && (
                        <div className="text-xs text-muted-foreground">
                          {[
                            suggestion.address.city,
                            suggestion.address.state,
                            suggestion.address.country,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {!loading && !mostrarHistorico && suggestions.length === 0 && inputValue.trim().length >= 3 && (
              <CommandEmpty>
                <div className="py-6 text-center text-sm">
                  <MapPin className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum endereço encontrado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tente usar termos mais específicos
                  </p>
                </div>
              </CommandEmpty>
            )}
            
            {!loading && inputValue.trim().length < 3 && !mostrarHistorico && (
              <CommandEmpty>
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground">
                    Digite pelo menos 3 caracteres para buscar
                  </p>
                </div>
              </CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
