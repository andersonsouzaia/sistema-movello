import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { CategoriaCampanha } from '@/types/database'

const CATEGORIAS: { id: CategoriaCampanha; label: string; description: string; emoji: string }[] = [
  { id: 'News', label: 'News', description: 'Notícias e atualidades', emoji: '📰' },
  { id: 'Food', label: 'Food', description: 'Gastronomia e alimentação', emoji: '🍔' },
  { id: 'Saúde', label: 'Saúde', description: 'Bem-estar e cuidados médicos', emoji: '🩺' },
  { id: 'Jogos', label: 'Jogos', description: 'Games e entretenimento', emoji: '🎮' },
  { id: 'Kids', label: 'Kids', description: 'Infantil e família', emoji: '🧸' },
  { id: 'Shopping', label: 'Shopping', description: 'Varejo e compras', emoji: '🛍️' },
  { id: 'Turismo', label: 'Turismo', description: 'Viagens e lazer', emoji: '✈️' },
  { id: 'Fitness', label: 'Fitness', description: 'Esportes e atividades físicas', emoji: '💪' },
  { id: 'Educação', label: 'Educação', description: 'Ensino e aprendizado', emoji: '🎓' },
]

interface NichoSelectorProps {
  nicho?: string
  categoria?: CategoriaCampanha
  onNichoChange: (nicho: string) => void
  onCategoriaChange: (categoria: CategoriaCampanha) => void
}

export function NichoSelector({ categoria, onNichoChange, onCategoriaChange }: NichoSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Selecione a Categoria Principal</Label>
        <p className="text-sm text-muted-foreground">
          Escolha a categoria que melhor representa sua campanha. Isso ajudará a direcionar seu anúncio para o público certo.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CATEGORIAS.map((cat) => {
          const isSelected = categoria === cat.id
          return (
            <div
              key={cat.id}
              className={cn(
                "relative flex items-center space-x-2 border rounded-xl p-4 cursor-pointer transition-all hover:bg-muted/50",
                isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
              )}
              onClick={() => {
                onCategoriaChange(cat.id)
                // Mantemos o nicho sincronizado com a categoria para compatibilidade, se necessário
                onNichoChange(cat.id)
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{cat.emoji}</span>
                  <span className={cn("font-medium", isSelected ? "text-primary" : "text-foreground")}>
                    {cat.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {cat.description}
                </p>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
