import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAdminFinance } from '@/hooks/useAdminFinance'
import { Loader2, DollarSign } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatCurrency } from '@/lib/utils/formatters'

interface AdminBalanceAdjustmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    empresaId: string
    empresaNome: string
    currentBalance?: number
    onSuccess?: () => void
}

const adjustmentSchema = z.object({
    valor: z.number({ invalid_type_error: 'Valor inválido' }).refine(val => val !== 0, 'O valor não pode ser zero'),
    descricao: z.string().min(5, 'A descrição deve ter no mínimo 5 caracteres'),
})

type AdjustmentFormData = z.infer<typeof adjustmentSchema>

export function AdminBalanceAdjustmentDialog({
    open,
    onOpenChange,
    empresaId,
    empresaNome,
    currentBalance = 0,
    onSuccess
}: AdminBalanceAdjustmentDialogProps) {
    const { adjustBalance, loading } = useAdminFinance()
    const [previewBalance, setPreviewBalance] = useState<number | null>(null)

    const form = useForm<AdjustmentFormData>({
        resolver: zodResolver(adjustmentSchema),
        defaultValues: {
            valor: 0,
            descricao: ''
        }
    })

    // Calcula saldo previsto quando o valor muda
    const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value)
        if (!isNaN(val)) {
            setPreviewBalance(currentBalance + val)
        } else {
            setPreviewBalance(null)
        }
        form.register('valor').onChange(e)
    }

    const onSubmit = async (data: AdjustmentFormData) => {
        try {
            await adjustBalance({
                empresaId,
                valor: data.valor,
                descricao: data.descricao
            })
            onOpenChange(false)
            form.reset()
            onSuccess?.()
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ajuste Manual de Saldo</DialogTitle>
                    <DialogDescription>
                        Adicione ou remova saldo da carteira da empresa <strong>{empresaNome}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Saldo Atual:</span>
                            <span className="font-medium">{formatCurrency(currentBalance)}</span>
                        </div>
                        {previewBalance !== null && (
                            <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                                <span className="text-muted-foreground">Saldo Previsto:</span>
                                <span className={previewBalance < 0 ? 'text-destructive font-bold' : 'text-primary font-bold'}>
                                    {formatCurrency(previewBalance)}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="valor">Valor do Ajuste (R$)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="valor"
                                type="number"
                                step="0.01"
                                className="pl-9"
                                placeholder="0.00"
                                {...form.register('valor', { valueAsNumber: true })}
                                onChange={handleValorChange}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Use valores negativos (ex: -50.00) para remover saldo.
                        </p>
                        {form.formState.errors.valor && (
                            <p className="text-sm text-destructive">{form.formState.errors.valor.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="descricao">Motivo/Descrição</Label>
                        <Textarea
                            id="descricao"
                            placeholder="Ex: Cancelamento de campanha #123 com estorno manual"
                            {...form.register('descricao')}
                        />
                        {form.formState.errors.descricao && (
                            <p className="text-sm text-destructive">{form.formState.errors.descricao.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Ajuste
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
