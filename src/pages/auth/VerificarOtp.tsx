import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

const otpSchema = z.object({
    code: z.string().min(6, 'O código deve ter pelo menos 6 dígitos'), // Aceita 6 a 8
})

type OtpFormData = z.infer<typeof otpSchema>

export default function VerificarOtp() {
    const { verifyOtp, sendRecoveryOtp } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Timer state
    const [timeLeft, setTimeLeft] = useState(0)

    // Get email from state or localStorage (fallback)
    const [email, setEmail] = useState<string | null>(null)

    useEffect(() => {
        const stateEmail = location.state?.email
        const storedEmail = localStorage.getItem('pending_email_verification')

        if (stateEmail) {
            setEmail(stateEmail)
        } else if (storedEmail) {
            setEmail(storedEmail)
        } else {
            toast.error('Email não encontrado. Inicie o processo novamente.')
            navigate('/recuperar-senha')
        }
    }, [location, navigate])

    // Timer effect
    useEffect(() => {
        if (timeLeft <= 0) return
        const intervalId = setInterval(() => {
            setTimeLeft(t => t - 1)
        }, 1000)
        return () => clearInterval(intervalId)
    }, [timeLeft])

    const form = useForm<OtpFormData>({
        resolver: zodResolver(otpSchema),
        defaultValues: {
            code: '',
        },
    })

    // Auto-submit when code is complete
    const handleComplete = (code: string) => {
        form.setValue('code', code)
        form.handleSubmit(onSubmit)()
    }

    const onSubmit = async (data: OtpFormData) => {
        if (!email) return

        setLoading(true)
        setError(null)

        try {
            const result = await verifyOtp(email, data.code)

            if (result.success) {
                toast.success('Código verificado com sucesso!')
                navigate('/redefinir-senha')
            } else {
                setError(result.error || 'Código inválido ou expirado.')
            }
        } catch (err) {
            setError('Erro ao verificar código. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (timeLeft > 0 || !email) return

        setError(null)
        setLoading(true) // Show loading state on resend too
        try {
            const result = await sendRecoveryOtp(email)
            if (result.success) {
                toast.success('Novo código enviado!')
                setTimeLeft(60) // 60 seconds cooldown
            } else {
                toast.error(result.error || 'Erro ao reenviar código')
            }
        } catch (err) {
            toast.error('Erro ao reenviar código')
        } finally {
            setLoading(false)
        }
    }

    if (!email) return null

    return (
        <AuthLayout
            title="Verificar Código"
            subtitle={`Digite o código enviado para ${email}`}
        >
            <div className="mb-8">
                <Button
                    variant="link"
                    size="sm"
                    className="pl-0 text-muted-foreground hover:text-foreground transition-colors group"
                    onClick={() => navigate('/recuperar-senha')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Voltar
                </Button>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Alert variant="destructive" className="border-destructive/50">
                                <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                                    <AlertCircle className="h-5 w-5 text-destructive" />
                                </div>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="flex justify-center"
                    >
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="sr-only">Código OTP</FormLabel>
                                    <FormControl>
                                        <InputOTP
                                            maxLength={8}
                                            {...field}
                                            onComplete={handleComplete}
                                        >
                                            <div className="flex items-center gap-2 sm:gap-4">
                                                <InputOTPGroup>
                                                    {Array.from({ length: 4 }).map((_, index) => (
                                                        <InputOTPSlot key={index} index={index} className="w-9 h-11 sm:w-10 sm:h-12 text-lg" />
                                                    ))}
                                                </InputOTPGroup>

                                                <InputOTPSeparator />

                                                <InputOTPGroup>
                                                    {Array.from({ length: 4 }).map((_, index) => (
                                                        <InputOTPSlot key={index + 4} index={index + 4} className="w-9 h-11 sm:w-10 sm:h-12 text-lg" />
                                                    ))}
                                                </InputOTPGroup>
                                            </div>
                                        </InputOTP>
                                    </FormControl>
                                    <FormDescription className="text-center text-sm pt-2">
                                        Insira o código de 8 dígitos recebido
                                    </FormDescription>
                                    <FormMessage className="text-center" />
                                </FormItem>
                            )}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                    >
                        <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
                            {loading ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Verificando...
                                </>
                            ) : (
                                'Verificar Código'
                            )}
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="text-center text-sm text-muted-foreground"
                    >
                        Não recebeu o código?{' '}
                        <button
                            type="button"
                            onClick={handleResend}
                            className={`text-primary font-medium transition-colors bg-transparent border-none cursor-pointer ${timeLeft > 0 || loading ? 'opacity-50 cursor-not-allowed' : 'hover:underline'
                                }`}
                            disabled={timeLeft > 0 || loading}
                        >
                            {timeLeft > 0 ? `Reenviar em ${timeLeft}s` : 'Reenviar'}
                        </button>
                    </motion.div>
                </form>
            </Form>
        </AuthLayout>
    )
}
