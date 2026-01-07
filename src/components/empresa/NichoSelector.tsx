import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Utensils, Shirt, Laptop, Heart, Sparkles, GraduationCap, Film, Wrench, ShoppingBag, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { NichoCategoria } from '@/types/database'

interface Nicho {
  slug: string
  nome: string
  icone: any
  descricao: string
}

const NICHOS: Nicho[] = [
  { slug: 'alimentacao', nome: 'Alimentação', icone: Utensils, descricao: 'Restaurantes, delivery, fast-food' },
  { slug: 'moda', nome: 'Moda', icone: Shirt, descricao: 'Roupas, acessórios, calçados' },
  { slug: 'tecnologia', nome: 'Tecnologia', icone: Laptop, descricao: 'Apps, software, hardware' },
  { slug: 'saude', nome: 'Saúde', icone: Heart, descricao: 'Clínicas, farmácias, academias' },
  { slug: 'beleza', nome: 'Beleza', icone: Sparkles, descricao: 'Salões, estética, cosméticos' },
  { slug: 'educacao', nome: 'Educação', icone: GraduationCap, descricao: 'Cursos, escolas, treinamentos' },
  { slug: 'entretenimento', nome: 'Entretenimento', icone: Film, descricao: 'Cinema, shows, eventos' },
  { slug: 'servicos', nome: 'Serviços', icone: Wrench, descricao: 'Consultoria, limpeza, manutenção' },
  { slug: 'varejo', nome: 'Varejo', icone: ShoppingBag, descricao: 'Lojas, e-commerce, shopping' },
  { slug: 'outros', nome: 'Outros', icone: MoreHorizontal, descricao: 'Outros segmentos' },
]

interface NichoSelectorProps {
  nicho?: string
  categorias?: string[]
  onNichoChange: (nicho: string) => void
  onCategoriasChange: (categorias: string[]) => void
  className?: string
  disabled?: boolean
}

export function NichoSelector({
  nicho,
  categorias = [],
  onNichoChange,
  onCategoriasChange,
  className,
  disabled = false,
}: NichoSelectorProps) {
  const [busca, setBusca] = useState('')
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<NichoCategoria[]>([])

  // Buscar categorias do nicho selecionado
  useEffect(() => {
    const buscarCategorias = async () => {
      if (!nicho) {
        setCategoriasDisponiveis([])
        return
      }

      try {
        const { data, error } = await supabase
          .from('nicho_categorias')
          .select('*')
          .eq('nicho', nicho)
          .order('ordem')

        if (error) {
          console.error('Erro ao buscar categorias:', error)
          setCategoriasDisponiveis([])
        } else {
          setCategoriasDisponiveis(data || [])
        }
      } catch (error) {
        console.error('Erro ao buscar categorias:', error)
        setCategoriasDisponiveis([])
      }
    }

    buscarCategorias()
  }, [nicho])

  const nichosFiltrados = useMemo(() => {
    if (!busca.trim()) return NICHOS
    
    const buscaLower = busca.toLowerCase()
    return NICHOS.filter(
      (n) =>
        n.nome.toLowerCase().includes(buscaLower) ||
        n.descricao.toLowerCase().includes(buscaLower)
    )
  }, [busca])

  const handleToggleCategoria = (categoria: string) => {
    if (categorias.includes(categoria)) {
      onCategoriasChange(categorias.filter((c) => c !== categoria))
    } else {
      onCategoriasChange([...categorias, categoria])
    }
  }

  const nichoSelecionado = NICHOS.find((n) => n.slug === nicho)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Seleção de Nicho */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-lg">Nicho da Campanha</CardTitle>
          <CardDescription>
            Selecione o nicho principal do seu negócio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca */}
          <div className="space-y-2">
            <Label>Buscar Nicho</Label>
            <Input
              placeholder="Digite para buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              disabled={disabled}
            />
          </div>

          {/* Grid de Nichos */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {nichosFiltrados.map((nichoItem) => {
              const Icon = nichoItem.icone
              const selecionado = nicho === nichoItem.slug
              
              return (
                <button
                  key={nichoItem.slug}
                  type="button"
                  onClick={() => !disabled && onNichoChange(nichoItem.slug)}
                  disabled={disabled}
                  className={cn(
                    "p-4 border-2 rounded-lg transition-all text-left",
                    "hover:border-primary hover:bg-primary/5",
                    selecionado
                      ? "border-primary bg-primary/10"
                      : "border-muted",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon className={cn(
                    "h-8 w-8 mb-2",
                    selecionado ? "text-primary" : "text-muted-foreground"
                  )} />
                  <p className={cn(
                    "font-medium text-sm",
                    selecionado && "text-primary"
                  )}>
                    {nichoItem.nome}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {nichoItem.descricao}
                  </p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Seleção de Categorias */}
      {nicho && categoriasDisponiveis.length > 0 && (
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-lg">Categorias</CardTitle>
            <CardDescription>
              Selecione as categorias específicas (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {categoriasDisponiveis.map((categoria) => (
                  <div key={categoria.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`categoria-${categoria.id}`}
                      checked={categorias.includes(categoria.categoria)}
                      onCheckedChange={() => handleToggleCategoria(categoria.categoria)}
                      disabled={disabled}
                    />
                    <Label
                      htmlFor={`categoria-${categoria.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      {categoria.categoria}
                      {categoria.descricao && (
                        <span className="text-xs text-muted-foreground ml-2">
                          - {categoria.descricao}
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Categorias Selecionadas */}
            {categorias.length > 0 && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <Label>Categorias Selecionadas ({categorias.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {categorias.map((cat) => (
                    <Badge key={cat} variant="secondary">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {nichoSelecionado && (
        <Card className="card-premium bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <nichoSelecionado.icone className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Nicho Selecionado</p>
                <p className="text-sm text-muted-foreground">
                  {nichoSelecionado.nome} - {nichoSelecionado.descricao}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


