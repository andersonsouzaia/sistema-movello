import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateCampanha, useEmpresaCampanha } from '@/hooks/useEmpresaCampanhas'
import { useEmpresaStats } from '@/hooks/useEmpresaStats'
import { useSalvarRascunho } from '@/hooks/useEmpresaRascunhos'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useUploadMidia } from '@/hooks/useEmpresaMidias'
import { CampaignWizard, type WizardStep } from '@/components/ui/CampaignWizard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle, CheckCircle2, Save, Loader2, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { TabletPreview } from '@/components/empresa/TabletPreview'

// Lazy load componentes pesados (mapas)
const MapSelector = lazy(() => import('@/components/empresa/MapSelector').then(m => ({ default: m.MapSelector })))
const LocationRadiusPicker = lazy(() => import('@/components/empresa/LocationRadiusPicker').then(m => ({ default: m.LocationRadiusPicker })))
const CityStateSelector = lazy(() => import('@/components/empresa/CityStateSelector').then(m => ({ default: m.CityStateSelector })))
const PolygonDrawer = lazy(() => import('@/components/empresa/PolygonDrawer').then(m => ({ default: m.PolygonDrawer })))
const LocationPreview = lazy(() => import('@/components/empresa/LocationPreview').then(m => ({ default: m.LocationPreview })))

import { LocationTemplates } from '@/components/empresa/LocationTemplates'
import { LocationHistory } from '@/components/empresa/LocationHistory'
import { CoverageEstimator } from '@/components/empresa/CoverageEstimator'
import { BudgetCalculator } from '@/components/empresa/BudgetCalculator'
import { CampaignTemplates } from '@/components/empresa/CampaignTemplates'
import { NichoSelector } from '@/components/empresa/NichoSelector'
import { PublicoAlvoEditor } from '@/components/empresa/PublicoAlvoEditor'
import { HorarioExibicaoEditor } from '@/components/empresa/HorarioExibicaoEditor'
import { ObjetivoSelector } from '@/components/empresa/ObjetivoSelector'
import { KPIsEditor } from '@/components/empresa/KPIsEditor'
import { EstrategiaSelector } from '@/components/empresa/EstrategiaSelector'
import type { LocalizacaoTipo, PublicoAlvo, HorarioExibicao, KPIsMeta, ObjetivoPrincipal, Estrategia } from '@/types/database'
import { validarCoordenadas } from '@/utils/geocoding'
import { empresaCampanhaService } from '@/services/empresaCampanhaService'

// Schemas Zod para cada etapa
const campanhaBasicaSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(255, 'Título deve ter no máximo 255 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  orcamento: z.number().min(100, 'Orçamento mínimo é R$ 100,00'),
  data_inicio: z.string().refine((date) => {
    // Permitir data antiga se for edição de rascunho (poderá ser validado no submit)
    return true
  }, 'Data de início deve ser maior ou igual à data atual'),
  data_fim: z.string(),
  horario_inicio: z.string().optional(),
  horario_fim: z.string().optional(),
}).refine((data) => {
  const inicio = new Date(data.data_inicio)
  const fim = new Date(data.data_fim)
  return fim > inicio
}, {
  message: 'Data de fim deve ser maior que a data de início',
  path: ['data_fim'],
})

const campanhaLocalizacaoSchema = z.object({
  localizacao_tipo: z.enum(['raio', 'poligono', 'cidade', 'estado', 'regiao']),
  raio_km: z.number().min(0.5).max(50).optional(),
  centro_latitude: z.number().min(-90).max(90).optional(),
  centro_longitude: z.number().min(-180).max(180).optional(),
  poligono_coordenadas: z.array(z.tuple([z.number(), z.number()])).min(3).optional(),
  cidades: z.array(z.string()).min(1).optional(),
  estados: z.array(z.string()).min(1).optional(),
}).refine((data) => {
  if (data.localizacao_tipo === 'raio') {
    return data.centro_latitude !== undefined && data.centro_longitude !== undefined && data.raio_km !== undefined
  }
  if (data.localizacao_tipo === 'poligono') {
    return data.poligono_coordenadas !== undefined && data.poligono_coordenadas.length >= 3
  }
  if (data.localizacao_tipo === 'cidade') {
    return data.cidades !== undefined && data.cidades.length > 0
  }
  if (data.localizacao_tipo === 'estado') {
    return data.estados !== undefined && data.estados.length > 0
  }
  return true
}, {
  message: 'Preencha todos os campos obrigatórios da localização',
})

const campanhaNichoSchema = z.object({
  nicho: z.string().min(1, 'Selecione um nicho'),
  categoria: z.enum(['News', 'Food', 'Saúde', 'Jogos', 'Kids', 'Shopping', 'Turismo', 'Fitness', 'Educação']),
})


const campanhaPublicoAlvoSchema = z.object({
  publico_alvo: z.object({
    idade_min: z.number().min(13).max(100),
    idade_max: z.number().min(13).max(100),
    genero: z.array(z.string()).optional(),
    interesses: z.array(z.string()).optional(),
  }).refine((data) => data.idade_min <= data.idade_max, {
    message: 'Idade mínima deve ser menor ou igual à máxima',
    path: ['idade_max'],
  }),
  horarios_exibicao: z.any().optional(),
  dias_semana: z.array(z.number()).min(1, 'Selecione pelo menos um dia da semana'),
})

const campanhaObjetivosSchema = z.object({
  objetivo_principal: z.enum(['awareness', 'consideracao', 'conversao', 'retencao', 'engajamento']),
  objetivos_secundarios: z.array(z.string()).optional(),
  kpis_meta: z.object({
    visualizacoes: z.number().min(0).optional(),
    cliques: z.number().min(0).optional(),
    conversoes: z.number().min(0).optional(),
    ctr: z.number().min(0).max(100).optional(),
    cpc: z.number().min(0).optional(),
    roi: z.number().optional(),
  }).optional(),
  estrategia: z.enum(['cpc', 'cpm', 'cpa', 'cpl']),
  qr_code_link: z.string().optional().or(z.literal('')),
  midias_urls: z.array(z.string()).optional(),
})

type CampanhaBasicaData = z.infer<typeof campanhaBasicaSchema>
type CampanhaLocalizacaoData = z.infer<typeof campanhaLocalizacaoSchema>
type CampanhaNichoSchema = z.infer<typeof campanhaNichoSchema>
type CampanhaPublicoAlvoData = z.infer<typeof campanhaPublicoAlvoSchema>
type CampanhaObjetivosData = z.infer<typeof campanhaObjetivosSchema>

// Componente separado para evitar re-renders infinitos
function LocalizacaoStepContent({ formLocalizacao }: { formLocalizacao: ReturnType<typeof useForm<CampanhaLocalizacaoData>> }) {
  const localizacaoTipo = formLocalizacao.watch('localizacao_tipo')
  const raioKm = formLocalizacao.watch('raio_km')
  const centroLatitude = formLocalizacao.watch('centro_latitude')
  const centroLongitude = formLocalizacao.watch('centro_longitude')
  const poligonoCoordenadas = formLocalizacao.watch('poligono_coordenadas') as [number, number][] | undefined
  const cidades = formLocalizacao.watch('cidades')
  const estados = formLocalizacao.watch('estados')

  const mapSelectorValue = useMemo(() => ({
    tipo: localizacaoTipo as LocalizacaoTipo,
    raio_km: raioKm,
    centro_latitude: centroLatitude,
    centro_longitude: centroLongitude,
    poligono_coordenadas: poligonoCoordenadas,
    cidades: cidades,
    estados: estados,
  }), [localizacaoTipo, raioKm, centroLatitude, centroLongitude, poligonoCoordenadas, cidades, estados])

  const handleMapSelectorChange = useCallback((value: {
    tipo: LocalizacaoTipo
    raio_km?: number
    centro_latitude?: number
    centro_longitude?: number
    poligono_coordenadas?: Array<[number, number]>
    cidades?: string[]
    estados?: string[]
  }) => {
    formLocalizacao.setValue('localizacao_tipo', value.tipo, { shouldDirty: true, shouldValidate: true })
    if (value.raio_km !== undefined) formLocalizacao.setValue('raio_km', value.raio_km, { shouldDirty: true, shouldValidate: true })
    if (value.centro_latitude !== undefined) formLocalizacao.setValue('centro_latitude', value.centro_latitude, { shouldDirty: true, shouldValidate: true })
    if (value.centro_longitude !== undefined) formLocalizacao.setValue('centro_longitude', value.centro_longitude, { shouldDirty: true, shouldValidate: true })
    if (value.poligono_coordenadas !== undefined) formLocalizacao.setValue('poligono_coordenadas', value.poligono_coordenadas, { shouldDirty: true, shouldValidate: true })
    if (value.cidades !== undefined) formLocalizacao.setValue('cidades', value.cidades, { shouldDirty: true, shouldValidate: true })
    if (value.estados !== undefined) formLocalizacao.setValue('estados', value.estados, { shouldDirty: true, shouldValidate: true })
  }, [formLocalizacao])

  const handleTemplateSelect = useCallback((template: any) => {
    // Definir tipo primeiro
    formLocalizacao.setValue('localizacao_tipo', template.localizacao_tipo, { shouldDirty: true, shouldValidate: true })

    // Aplicar valores específicos e limpar os outros para evitar conflitos de validação
    if (template.localizacao_tipo === 'raio') {
      if (template.raio_km !== undefined) formLocalizacao.setValue('raio_km', template.raio_km, { shouldDirty: true, shouldValidate: true })
      if (template.centro_latitude !== undefined) formLocalizacao.setValue('centro_latitude', template.centro_latitude, { shouldDirty: true, shouldValidate: true })
      if (template.centro_longitude !== undefined) formLocalizacao.setValue('centro_longitude', template.centro_longitude, { shouldDirty: true, shouldValidate: true })
    } else if (template.localizacao_tipo === 'poligono') {
      if (template.poligono_coordenadas) formLocalizacao.setValue('poligono_coordenadas', template.poligono_coordenadas, { shouldDirty: true, shouldValidate: true })
    } else if (template.localizacao_tipo === 'cidade') {
      if (template.cidades) formLocalizacao.setValue('cidades', template.cidades, { shouldDirty: true, shouldValidate: true })
    } else if (template.localizacao_tipo === 'estado') {
      if (template.estados) formLocalizacao.setValue('estados', template.estados, { shouldDirty: true, shouldValidate: true })
    }
  }, [formLocalizacao])

  const handleHistorySelect = useCallback((item: any) => {
    if (item.localizacao_tipo) {
      formLocalizacao.setValue('localizacao_tipo', item.localizacao_tipo, { shouldDirty: true, shouldValidate: true })
    }
    // Lógica similar de aplicar apenas os campos relevantes
    if (item.localizacao_tipo === 'raio' && item.lat && item.lng) {
      formLocalizacao.setValue('centro_latitude', item.lat, { shouldDirty: true, shouldValidate: true })
      formLocalizacao.setValue('centro_longitude', item.lng, { shouldDirty: true, shouldValidate: true })
      if (item.raio_km) formLocalizacao.setValue('raio_km', item.raio_km, { shouldDirty: true, shouldValidate: true })
    } else if (item.localizacao_tipo === 'poligono' && item.poligono_coordenadas) {
      formLocalizacao.setValue('poligono_coordenadas', item.poligono_coordenadas, { shouldDirty: true, shouldValidate: true })
    } else if (item.localizacao_tipo === 'cidade' && item.cidades) {
      formLocalizacao.setValue('cidades', item.cidades, { shouldDirty: true, shouldValidate: true })
    } else if (item.localizacao_tipo === 'estado' && item.estados) {
      formLocalizacao.setValue('estados', item.estados, { shouldDirty: true, shouldValidate: true })
    }
  }, [formLocalizacao])

  // Calcular área para CoverageEstimator
  const areaKm2 = useMemo(() => {
    if (localizacaoTipo === 'raio' && raioKm) {
      return Math.PI * raioKm * raioKm
    }
    if (localizacaoTipo === 'poligono' && poligonoCoordenadas && poligonoCoordenadas.length >= 3) {
      let area = 0
      for (let i = 0; i < poligonoCoordenadas.length; i++) {
        const j = (i + 1) % poligonoCoordenadas.length
        area += poligonoCoordenadas[i][0] * poligonoCoordenadas[j][1]
        area -= poligonoCoordenadas[j][0] * poligonoCoordenadas[i][1]
      }
      return Math.abs(area) * 0.5 * 111 * 111 / 1000000
    }
    return 0
  }, [localizacaoTipo, raioKm, poligonoCoordenadas])

  // Loading component para Suspense
  const MapLoadingFallback = () => (
    <div className="flex items-center justify-center p-8 border border-border rounded-lg bg-muted/50">
      <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
      <span className="text-sm text-muted-foreground">Carregando mapa...</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Templates e Histórico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LocationTemplates
          onSelectTemplate={handleTemplateSelect}
          currentLocation={mapSelectorValue}
        />
        <LocationHistory
          onSelect={handleHistorySelect}
        />
      </div>

      <Suspense fallback={<MapLoadingFallback />}>
        <MapSelector
          value={mapSelectorValue}
          onChange={handleMapSelectorChange}
          tipo={localizacaoTipo as LocalizacaoTipo}
        />
      </Suspense>

      {localizacaoTipo === 'raio' && (
        <Suspense fallback={<MapLoadingFallback />}>
          <LocationRadiusPicker
            value={raioKm}
            onChange={(raio) => formLocalizacao.setValue('raio_km', raio, { shouldDirty: true })}
          />
        </Suspense>
      )}

      {(localizacaoTipo === 'cidade' || localizacaoTipo === 'estado') && (
        <Suspense fallback={<MapLoadingFallback />}>
          <CityStateSelector
            cidades={cidades}
            estados={estados}
            onCidadesChange={(cidades) => formLocalizacao.setValue('cidades', cidades, { shouldDirty: true })}
            onEstadosChange={(estados) => formLocalizacao.setValue('estados', estados, { shouldDirty: true })}
            tipo={localizacaoTipo === 'cidade' ? 'cidade' : 'estado'}
          />
        </Suspense>
      )}

      {localizacaoTipo === 'poligono' && (
        <Suspense fallback={<MapLoadingFallback />}>
          <PolygonDrawer
            value={poligonoCoordenadas}
            onChange={(poligono) => formLocalizacao.setValue('poligono_coordenadas', poligono, { shouldDirty: true })}
          />
        </Suspense>
      )}

      {/* Estimativa de Cobertura e Preview removidos para centralizar no mapa */}
    </div>
  )
}

export default function NovaCampanha() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { empresa } = useAuth()
  const { stats } = useEmpresaStats()
  const { createCampanha, loading: creating } = useCreateCampanha()
  const { salvarRascunho, loading: salvandoRascunho } = useSalvarRascunho()
  const { uploadMidia, loading: enviandoMidia } = useUploadMidia()

  const [currentStep, setCurrentStep] = useState(0)
  const [rascunhoId, setRascunhoId] = useState<string | null>(searchParams.get('rascunho') || searchParams.get('id') || null)

  // Hook para buscar dados do rascunho se existir ID
  const { campanha: draftData, loading: loadingDraft } = useEmpresaCampanha(rascunhoId || '')

  // Estados para cada etapa

  // Formulários
  const formBasica = useForm<CampanhaBasicaData>({
    resolver: zodResolver(campanhaBasicaSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      orcamento: 0,
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      horario_inicio: '00:00',
      horario_fim: '23:59',
    },
  })

  const formLocalizacao = useForm<CampanhaLocalizacaoData>({
    resolver: zodResolver(campanhaLocalizacaoSchema),
    defaultValues: {
      localizacao_tipo: 'raio',
    },
  })

  const formNicho = useForm<CampanhaNichoSchema>({
    resolver: zodResolver(campanhaNichoSchema),
    defaultValues: {
      nicho: '',
      // @ts-ignore
      categoria: undefined,
    },
  })

  const formPublicoAlvo = useForm<CampanhaPublicoAlvoData>({
    resolver: zodResolver(campanhaPublicoAlvoSchema),
    defaultValues: {
      publico_alvo: {
        idade_min: 18,
        idade_max: 65,
        genero: ['Todos'],
        interesses: [],
      },
      dias_semana: [1, 2, 3, 4, 5],
      horarios_exibicao: {
        '1': { inicio: '08:00', fim: '18:00' },
        '2': { inicio: '08:00', fim: '18:00' },
        '3': { inicio: '08:00', fim: '18:00' },
        '4': { inicio: '08:00', fim: '18:00' },
        '5': { inicio: '08:00', fim: '18:00' },
      },
    },
  })

  const formObjetivos = useForm<CampanhaObjetivosData>({
    resolver: zodResolver(campanhaObjetivosSchema),
    defaultValues: {
      objetivo_principal: 'awareness',
      objetivos_secundarios: [],
      estrategia: 'cpc',
    },
  })

  // Estado para controlar a tela de seleção inicial (Meta-style)
  // Se não houver rascunho sendo carregado, exibe a seleção.
  const [showTemplateSelection, setShowTemplateSelection] = useState(!rascunhoId)

  // Função para aplicar template e iniciar o wizard
  const handleApplyTemplate = (template: any) => {
    if (template && template.dados_template) {
      const dados = template.dados_template

      // Dados básicos
      if (dados.titulo) formBasica.setValue('titulo', dados.titulo)
      if (dados.descricao) formBasica.setValue('descricao', dados.descricao)
      if (dados.orcamento) formBasica.setValue('orcamento', dados.orcamento)
      if (dados.data_inicio) formBasica.setValue('data_inicio', dados.data_inicio)
      if (dados.data_fim) formBasica.setValue('data_fim', dados.data_fim)

      // Localização
      if (dados.localizacao_tipo) formLocalizacao.setValue('localizacao_tipo', dados.localizacao_tipo)
      if (dados.raio_km) formLocalizacao.setValue('raio_km', dados.raio_km)
      if (dados.centro_latitude) formLocalizacao.setValue('centro_latitude', dados.centro_latitude)
      if (dados.centro_longitude) formLocalizacao.setValue('centro_longitude', dados.centro_longitude)
      if (dados.poligono_coordenadas) formLocalizacao.setValue('poligono_coordenadas', dados.poligono_coordenadas)
      if (dados.cidades) formLocalizacao.setValue('cidades', dados.cidades)
      if (dados.estados) formLocalizacao.setValue('estados', dados.estados)

      // Nicho
      if (dados.nicho) formNicho.setValue('nicho', dados.nicho)
      if (dados.categoria) formNicho.setValue('categoria', dados.categoria)

      // Público-alvo
      if (dados.publico_alvo) formPublicoAlvo.setValue('publico_alvo', dados.publico_alvo)
      if (dados.horarios_exibicao) formPublicoAlvo.setValue('horarios_exibicao', dados.horarios_exibicao)
      if (dados.dias_semana) formPublicoAlvo.setValue('dias_semana', dados.dias_semana)

      // Objetivos
      if (dados.objetivo_principal) formObjetivos.setValue('objetivo_principal', dados.objetivo_principal)
      if (dados.objetivos_secundarios) formObjetivos.setValue('objetivos_secundarios', dados.objetivos_secundarios)
      if (dados.kpis_meta) formObjetivos.setValue('kpis_meta', dados.kpis_meta)
      if (dados.estrategia) formObjetivos.setValue('estrategia', dados.estrategia)
      // Carregar mídias e QR Code
      if (dados.qr_code_link) formObjetivos.setValue('qr_code_link', dados.qr_code_link)
      if (dados.midias_urls) formObjetivos.setValue('midias_urls', dados.midias_urls)

      toast.success(`Template "${template.nome}" aplicado!`)
    }
    setShowTemplateSelection(false)
  }

  // Validar saldo (apenas para criação, não para rascunho)
  const orcamento = formBasica.watch('orcamento')
  const saldoInsuficiente = stats && orcamento > 0 && orcamento > stats.saldo_disponivel
  const podeCriarRascunho = true // Sempre pode criar rascunho, mesmo sem saldo

  // Função para coletar todos os dados dos formulários
  const coletarDadosRascunho = useCallback((): any => {
    const basicaData = formBasica.getValues()
    const localizacaoData = formLocalizacao.getValues()
    const nichoData = formNicho.getValues()
    const publicoAlvoData = formPublicoAlvo.getValues()
    const objetivosData = formObjetivos.getValues()

    // Validar apenas dados básicos mínimos para criar um rascunho
    if (!basicaData.titulo || basicaData.titulo.trim().length < 3) {
      return null // Não salvar se não tiver título mínimo
    }

    // Preparar dados para salvar (usar valores padrão para campos não preenchidos)
    const dadosRascunho: any = {
      // Dados básicos (obrigatórios mínimos)
      titulo: basicaData.titulo || 'Novo Rascunho',
      descricao: basicaData.descricao || '',
      orcamento: basicaData.orcamento || 0,
      data_inicio: basicaData.data_inicio || new Date().toISOString().split('T')[0],
      data_fim: basicaData.data_fim || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      horario_inicio: basicaData.horario_inicio || '00:00',
      horario_fim: basicaData.horario_fim || '23:59',
    }

    // Adicionar dados de localização apenas se preenchidos
    if (localizacaoData?.localizacao_tipo) {
      dadosRascunho.localizacao_tipo = localizacaoData.localizacao_tipo
      if (localizacaoData.raio_km !== undefined && localizacaoData.raio_km !== null) dadosRascunho.raio_km = localizacaoData.raio_km
      if (localizacaoData.centro_latitude !== undefined && localizacaoData.centro_latitude !== null) dadosRascunho.centro_latitude = localizacaoData.centro_latitude
      if (localizacaoData.centro_longitude !== undefined && localizacaoData.centro_longitude !== null) dadosRascunho.centro_longitude = localizacaoData.centro_longitude
      if (localizacaoData.poligono_coordenadas && localizacaoData.poligono_coordenadas.length > 0) dadosRascunho.poligono_coordenadas = localizacaoData.poligono_coordenadas as any
      if (localizacaoData.cidades && localizacaoData.cidades.length > 0) dadosRascunho.cidades = localizacaoData.cidades
      if (localizacaoData.estados && localizacaoData.estados.length > 0) dadosRascunho.estados = localizacaoData.estados
      // regioes removido pois não existe no type
    }

    // Adicionar dados de nicho apenas se preenchidos
    if (nichoData?.nicho) {
      dadosRascunho.nicho = nichoData.nicho
      if (nichoData.categoria) dadosRascunho.categoria = nichoData.categoria
    }

    // Adicionar dados de público-alvo apenas se preenchidos
    if (publicoAlvoData?.publico_alvo) {
      dadosRascunho.publico_alvo = publicoAlvoData.publico_alvo as any
    }
    if (publicoAlvoData?.horarios_exibicao && Object.keys(publicoAlvoData.horarios_exibicao).length > 0) {
      dadosRascunho.horarios_exibicao = publicoAlvoData.horarios_exibicao as any
    }
    if (publicoAlvoData?.dias_semana && publicoAlvoData.dias_semana.length > 0) {
      dadosRascunho.dias_semana = publicoAlvoData.dias_semana
    }

    // Adicionar dados de objetivos apenas se preenchidos
    if (objetivosData?.objetivo_principal) {
      dadosRascunho.objetivo_principal = objetivosData.objetivo_principal
      if (objetivosData.objetivos_secundarios && objetivosData.objetivos_secundarios.length > 0) {
        dadosRascunho.objetivos_secundarios = objetivosData.objetivos_secundarios
      }
      if (objetivosData.kpis_meta) {
        dadosRascunho.kpis_meta = objetivosData.kpis_meta
      }
      if (objetivosData.estrategia) {
        dadosRascunho.estrategia = objetivosData.estrategia
      }
      if (objetivosData.qr_code_link) {
        dadosRascunho.qr_code_link = objetivosData.qr_code_link
      }
      if (objetivosData.midias_urls && objetivosData.midias_urls.length > 0) {
        dadosRascunho.midias_urls = objetivosData.midias_urls
      }
    }

    return dadosRascunho
  }, [formBasica, formLocalizacao, formNicho, formPublicoAlvo, formObjetivos])

  // Watch todos os campos para auto-save
  const basicaValues = formBasica.watch()
  const localizacaoValues = formLocalizacao.watch()
  const nichoValues = formNicho.watch()
  const publicoAlvoValues = formPublicoAlvo.watch()
  const objetivosValues = formObjetivos.watch()

  // Dados combinados para auto-save
  const dadosCombinados = useMemo(() => {
    return {
      basica: basicaValues,
      localizacao: localizacaoValues,
      nicho: nichoValues,
      publicoAlvo: publicoAlvoValues,
      objetivos: objetivosValues,
    }
  }, [basicaValues, localizacaoValues, nichoValues, publicoAlvoValues, objetivosValues])

  // Auto-save com debounce
  const { isSaving, lastSaved, saveError } = useAutoSave(dadosCombinados, {
    debounceMs: 2000,
    enabled: true,
    onSave: async () => {
      const dadosRascunho = coletarDadosRascunho()
      if (dadosRascunho) {
        const id = await salvarRascunho(rascunhoId, dadosRascunho)
        if (id && !rascunhoId) {
          setRascunhoId(id)
          // Atualizar URL sem recarregar página
          window.history.replaceState({}, '', `/empresa/campanhas/nova?rascunho=${id}`)
        }
      }
    },
    onSaveStart: () => {
      // Silencioso - não mostrar toast durante auto-save
    },
    onSaveSuccess: () => {
      // Silencioso - não mostrar toast durante auto-save
    },
    onSaveError: (error) => {
      // Log apenas, não mostrar toast para não incomodar
      console.error('Erro no auto-save:', error)
    },
  })

  const [isFinishing, setIsFinishing] = useState(false)

  const handleFinish = async () => {
    if (isFinishing || creating) return
    setIsFinishing(true)

    // Validar todas as etapas
    const basicaValid = await formBasica.trigger()
    const localizacaoValid = await formLocalizacao.trigger()
    const nichoValid = await formNicho.trigger()
    const publicoAlvoValid = await formPublicoAlvo.trigger()
    const objetivosValid = await formObjetivos.trigger()

    if (!basicaValid || !localizacaoValid || !nichoValid || !publicoAlvoValid || !objetivosValid) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      setIsFinishing(false)
      return
    }

    // Validar saldo apenas ao criar campanha (não ao salvar rascunho)
    if (saldoInsuficiente) {
      toast.error(
        `Saldo insuficiente. Saldo disponível: ${formatCurrency(stats?.saldo_disponivel || 0)}. ` +
        `Você pode salvar como rascunho e ativar quando tiver saldo suficiente.`
      )
      setIsFinishing(false)
      return
    }

    const basicaData = formBasica.getValues()
    const localizacaoData = formLocalizacao.getValues()
    const nichoData = formNicho.getValues()
    const publicoAlvoData = formPublicoAlvo.getValues()
    const objetivosData = formObjetivos.getValues()

    try {
      if (rascunhoId && draftData?.status !== 'rascunho') {
        await empresaCampanhaService.updateCampanha(rascunhoId, {
          ...basicaData,
          ...localizacaoData, // Inclui dados de localização no update se necessário (API precisa suportar)
          // ... outros dados se a API suportar update completo
          midias_urls: objetivosData.midias_urls,
          qr_code_link: objetivosData.qr_code_link
        })
        toast.success('Campanha atualizada com sucesso!')
      } else {
        await createCampanha({
          ...basicaData,
          ...localizacaoData,
          poligono_coordenadas: localizacaoData.poligono_coordenadas as any,
          ...nichoData,
          ...publicoAlvoData,
          publico_alvo: publicoAlvoData.publico_alvo as any,
          horarios_exibicao: publicoAlvoData.horarios_exibicao as any,
          ...objetivosData,
        })
        toast.success('Campanha criada com sucesso! Aguardando aprovação.')
      }

      navigate('/empresa/campanhas')
    } catch (error) {
      // Erro já é tratado no hook
      setIsFinishing(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      const dadosRascunho = coletarDadosRascunho()

      if (!dadosRascunho) {
        toast.error('Por favor, preencha pelo menos o título da campanha (mínimo 3 caracteres)')
        return
      }

      // Salvar como rascunho (não valida saldo nem todas as etapas)
      const id = await salvarRascunho(rascunhoId, dadosRascunho)

      if (id && !rascunhoId) {
        setRascunhoId(id)
      }

      toast.success('Rascunho salvo com sucesso! Você pode continuar editando depois.')
      navigate('/empresa/campanhas')
    } catch (error) {
      // Erro já é tratado no hook
    }
  }

  // Etapas do wizard
  const steps: WizardStep[] = [
    {
      id: 'basica',
      title: 'Informações Básicas',
      description: 'Dados principais da campanha',
      onValidate: async () => {
        const isValid = await formBasica.trigger()
        if (!isValid) {
          toast.error('Por favor, preencha todos os campos obrigatórios da etapa de Informações Básicas')
        }
        return isValid
      },
      component: (
        <div className="space-y-6">


          {stats && (
            <Card className="card-premium">
              <CardHeader>
                <CardTitle>Saldo Disponível</CardTitle>
                <CardDescription>Verifique seu saldo antes de criar a campanha</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      stats.saldo_disponivel < 100 ? "text-yellow-500" : "text-primary"
                    )}>
                      {formatCurrency(stats.saldo_disponivel)}
                    </p>
                  </div>
                  {stats.saldo_disponivel < 100 && (
                    <Button
                      variant="outline"
                      onClick={() => navigate('/empresa/pagamentos')}
                    >
                      Adicionar Saldo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {saldoInsuficiente && (
            <Alert className="border-yellow-500/20 bg-yellow-500/5">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <AlertDescription>
                Saldo insuficiente para criar esta campanha. Saldo disponível: {formatCurrency(stats?.saldo_disponivel || 0)}.
                Você pode salvar como rascunho e ativar quando tiver saldo suficiente.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título da Campanha *</Label>
              <Input
                id="titulo"
                {...formBasica.register('titulo')}
                placeholder="Ex: Campanha Verão 2024"
                className="h-11"
              />
              {formBasica.formState.errors.titulo && (
                <p className="text-sm text-destructive">
                  {formBasica.formState.errors.titulo.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                {...formBasica.register('descricao')}
                placeholder="Descreva sua campanha..."
                rows={4}
              />
              {formBasica.formState.errors.descricao && (
                <p className="text-sm text-destructive">
                  {formBasica.formState.errors.descricao.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data de Início *</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  {...formBasica.register('data_inicio')}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-11"
                />
                {formBasica.formState.errors.data_inicio && (
                  <p className="text-sm text-destructive">
                    {formBasica.formState.errors.data_inicio.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_fim">Data de Fim *</Label>
                <Input
                  id="data_fim"
                  type="date"
                  {...formBasica.register('data_fim')}
                  min={formBasica.watch('data_inicio') || new Date().toISOString().split('T')[0]}
                  className="h-11"
                />
                {formBasica.formState.errors.data_fim && (
                  <p className="text-sm text-destructive">
                    {formBasica.formState.errors.data_fim.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario_inicio">Horário de Início</Label>
                <Input
                  id="horario_inicio"
                  type="time"
                  {...formBasica.register('horario_inicio')}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario_fim">Horário de Fim</Label>
                <Input
                  id="horario_fim"
                  type="time"
                  {...formBasica.register('horario_fim')}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orcamento">Orçamento (R$) *</Label>
              <Input
                id="orcamento"
                type="number"
                step="0.01"
                min="100"
                {...formBasica.register('orcamento', { valueAsNumber: true })}
                placeholder="1000.00"
                className="h-11"
              />
              {formBasica.formState.errors.orcamento && (
                <p className="text-sm text-destructive">
                  {formBasica.formState.errors.orcamento.message}
                </p>
              )}
              {stats && (
                <p className="text-xs text-muted-foreground">
                  Saldo disponível: {formatCurrency(stats.saldo_disponivel)}
                </p>
              )}
            </div>
          </div>
        </div>
      ),
      isValid: formBasica.formState.isValid, // Não validar saldo aqui - permite salvar rascunho mesmo sem saldo
      isComplete: !!formBasica.watch('titulo'),
    },
    {
      id: 'localizacao',
      title: 'Geolocalização',
      description: 'Defina onde sua campanha será exibida',
      onValidate: async () => {
        const isValid = await formLocalizacao.trigger()
        if (!isValid) {
          toast.error('Por favor, complete a configuração de geolocalização')
        }
        return isValid
      },
      component: (
        <LocalizacaoStepContent formLocalizacao={formLocalizacao} />
      ),
      isValid: formLocalizacao.formState.isValid,
      isComplete: !!formLocalizacao.watch('localizacao_tipo'),
    },
    {
      id: 'nicho',
      title: 'Nicho e Categorias',
      description: 'Selecione a categoria principal da sua campanha',
      onValidate: async () => {
        const isValid = await formNicho.trigger()
        if (!isValid) {
          toast.error('Por favor, selecione uma categoria')
        }
        return isValid
      },
      component: (
        <NichoSelector
          nicho={formNicho.watch('nicho')}
          categoria={formNicho.watch('categoria')}
          onNichoChange={(nicho) => formNicho.setValue('nicho', nicho, { shouldDirty: true, shouldValidate: true })}
          onCategoriaChange={(categoria) => formNicho.setValue('categoria', categoria, { shouldDirty: true, shouldValidate: true })}
        />
      ),
      isValid: formNicho.formState.isValid,
      isComplete: !!formNicho.watch('categoria'),
    },
    {
      id: 'publico-alvo',
      title: 'Público-Alvo e Horários',
      description: 'Defina seu público-alvo e horários de exibição',
      onValidate: async () => {
        const isValid = await formPublicoAlvo.trigger()
        if (!isValid) {
          toast.error('Por favor, complete a configuração de público-alvo e horários')
        }
        return isValid
      },
      component: (
        <div className="space-y-6">
          <PublicoAlvoEditor
            value={formPublicoAlvo.watch('publico_alvo') as any}
            onChange={(publicoAlvo) => formPublicoAlvo.setValue('publico_alvo', publicoAlvo as any, { shouldValidate: true })}
          />
          <HorarioExibicaoEditor
            value={formPublicoAlvo.watch('horarios_exibicao') as any}
            diasSemana={formPublicoAlvo.watch('dias_semana')}
            onHorariosChange={(horarios) => formPublicoAlvo.setValue('horarios_exibicao', horarios, { shouldValidate: true })}
            onDiasSemanaChange={(dias) => formPublicoAlvo.setValue('dias_semana', dias, { shouldValidate: true })}
          />
        </div>
      ),
      isValid: formPublicoAlvo.formState.isValid,
      isComplete: undefined, // Opcional
    },
    {
      id: 'objetivos',
      title: 'Objetivos e KPIs',
      description: 'Defina os objetivos e metas da campanha',
      onValidate: async () => {
        const isValid = await formObjetivos.trigger()
        if (!isValid) {
          toast.error('Por favor, complete a configuração de objetivos e KPIs')
        }
        return isValid
      },
      component: (
        <div className="space-y-6">
          <ObjetivoSelector
            objetivoPrincipal={formObjetivos.watch('objetivo_principal') as ObjetivoPrincipal}
            objetivosSecundarios={formObjetivos.watch('objetivos_secundarios')}
            onObjetivoPrincipalChange={(objetivo) => formObjetivos.setValue('objetivo_principal', objetivo)}
            onObjetivosSecundariosChange={(objetivos) => formObjetivos.setValue('objetivos_secundarios', objetivos)}
          />
          <KPIsEditor
            value={formObjetivos.watch('kpis_meta')}
            objetivoPrincipal={formObjetivos.watch('objetivo_principal') as ObjetivoPrincipal}
            orcamento={formBasica.watch('orcamento')}
            onChange={(kpis) => formObjetivos.setValue('kpis_meta', kpis)}
          />
          <EstrategiaSelector
            value={formObjetivos.watch('estrategia') as Estrategia}
            objetivoPrincipal={formObjetivos.watch('objetivo_principal') as ObjetivoPrincipal}
            onChange={(estrategia) => formObjetivos.setValue('estrategia', estrategia)}
          />
        </div>
      ),
      isValid: formObjetivos.formState.isValid,
      isComplete: !!formObjetivos.watch('objetivo_principal'),
    },
    {
      id: 'criativos',
      title: 'Criativos e Mídias',
      description: 'Adicione suas mídias e configure o QR Code',
      onValidate: async () => {
        return true;
      },
      component: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna da Esquerda: Inputs */}
          <div className="space-y-6">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle>Configuração Visual</CardTitle>
                <CardDescription>Adicione as mídias que aparecerão nos tablets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Link do QR Code */}
                <div className="space-y-2">
                  <Label>Link de Destino do QR Code</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://seu-site.com/campanha"
                      value={formObjetivos.watch('qr_code_link') || ''}
                      onChange={(e) => formObjetivos.setValue('qr_code_link', e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este é o link que abrirá quando o passageiro escanear o QR Code.
                  </p>
                </div>

                {/* Upload de Mídias */}
                <div className="space-y-2">
                  <Label>Mídias da Campanha</Label>
                  <div className="relative border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-2 hover:bg-accent/50 transition-colors cursor-pointer bg-muted/20">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={false}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        const toastId = toast.loading('Enviando mídia...')
                        try {
                          const categoria = formNicho.getValues('categoria')
                          const uploadedMidia = await uploadMidia(rascunhoId || 'temp', file, 'imagem', categoria)

                          if (uploadedMidia?.url) {
                            const current = formObjetivos.getValues('midias_urls') || []
                            formObjetivos.setValue('midias_urls', [...current, uploadedMidia.url])
                            toast.success('Mídia enviada com sucesso!', { id: toastId })
                          }
                        } catch (error) {
                          console.error(error)
                          toast.error('Erro ao enviar mídia', { id: toastId })
                        }
                        e.target.value = ''
                      }}
                    />
                    <div className="h-10 w-10 text-muted-foreground mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H3.75A2.25 2.25 0 0 0 1.5 6v12a2.25 2.25 0 0 0 2.25 2.25Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </div>
                    <p className="font-medium">Adicionar Imagem ou Vídeo</p>
                    <p className="text-xs text-muted-foreground">Arraste e solte ou clique para selecionar</p>
                  </div>

                  {/* Fallback Manual URLs */}
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs">Mídias adicionadas:</Label>
                    <div className="flex flex-col gap-2 mt-2 max-h-40 overflow-y-auto">
                      {(formObjetivos.watch('midias_urls') || []).map((url, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-md group">
                          <div className="h-8 w-8 rounded bg-background overflow-hidden shrink-0">
                            {url.match(/\.(mp4|webm|ogg)$/i) ? (
                              <video src={url} className="h-full w-full object-cover" />
                            ) : (
                              <img src={url} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <span className="text-xs truncate flex-1">{url}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const current = formObjetivos.watch('midias_urls') || [];
                              formObjetivos.setValue('midias_urls', current.filter((_, i) => i !== idx));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {(!formObjetivos.watch('midias_urls') || formObjetivos.watch('midias_urls')?.length === 0) && (
                        <p className="text-xs text-muted-foreground italic">Nenhuma mídia adicionada ainda.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna da Direita: Preview Sticky */}
          <div className="lg:sticky lg:top-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground font-medium">Pré-visualização no Tablet</Label>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Modo Paisagem</Badge>
            </div>

            <TabletPreview
              mediaUrl={(formObjetivos.watch('midias_urls') || [])[0]} // Mostra a primeira mídia
              qrCodeLink={formObjetivos.watch('qr_code_link')}
              title={formBasica.watch('titulo')}
              description={formBasica.watch('descricao')}
              orientation="landscape"
              className="origin-top scale-90 lg:scale-100 transition-transform"
            />

            <p className="text-xs text-center text-muted-foreground w-full max-w-[600px]">
              * Esta é uma simulação aproximada. A aparência final pode variar dependendo do modelo do tablet instalado no veículo.
            </p>
          </div>
        </div>
      ),
      isValid: true,
      isComplete: !!formObjetivos.watch('midias_urls')?.length || !!formObjetivos.watch('qr_code_link'),
    },
    {
      id: 'revisao',
      title: 'Revisão e Mídias',
      description: 'Revise os dados e adicione mídias (opcional)',
      component: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle>Resumo da Campanha</CardTitle>
                <CardDescription>Revise todas as informações antes de criar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Título</p>
                  <p className="text-lg">{formBasica.watch('titulo')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                  <p className="text-sm">{formBasica.watch('descricao')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Orçamento</p>
                    <p className="text-lg font-semibold">{formatCurrency(formBasica.watch('orcamento'))}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data Início</p>
                    <p className="text-sm">{new Date(formBasica.watch('data_inicio')).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data Fim</p>
                    <p className="text-sm">{new Date(formBasica.watch('data_fim')).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Localização</p>
                  <p className="text-sm capitalize">{formLocalizacao.watch('localizacao_tipo')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nicho</p>
                  <p className="text-sm capitalize">{formNicho.watch('nicho')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Objetivo Principal</p>
                  <p className="text-sm capitalize">{formObjetivos.watch('objetivo_principal')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Final */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground font-medium">Pré-visualização Final</Label>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Modo Paisagem</Badge>
            </div>

            <TabletPreview
              mediaUrl={(formObjetivos.watch('midias_urls') || [])[0]}
              qrCodeLink={formObjetivos.watch('qr_code_link')}
              title={formBasica.watch('titulo')}
              description={formBasica.watch('descricao')}
              orientation="landscape"
              className="origin-top scale-90 lg:scale-100 transition-transform"
            />

            <p className="text-xs text-center text-muted-foreground">
              Esta é a aparência final do seu anúncio nos tablets.
            </p>
          </div>
        </div>
      ),
      isValid: true,
      isComplete: true,
    },
  ]



  // Popula os formulários quando os dados do rascunho são carregados
  useEffect(() => {
    if (draftData && !loadingDraft) {
      // 1. Informações Básicas
      formBasica.reset({
        titulo: draftData.titulo || '',
        descricao: draftData.descricao || '',
        orcamento: draftData.orcamento || 0,
        data_inicio: draftData.data_inicio ? new Date(draftData.data_inicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        data_fim: draftData.data_fim ? new Date(draftData.data_fim).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        horario_inicio: draftData.horario_inicio || '00:00',
        horario_fim: draftData.horario_fim || '23:59',
      })

      // 2. Localização
      formLocalizacao.reset({
        localizacao_tipo: (draftData.localizacao_tipo as any) || 'raio',
        raio_km: draftData.raio_km || undefined,
        centro_latitude: draftData.centro_latitude || undefined,
        centro_longitude: draftData.centro_longitude || undefined,
        poligono_coordenadas: (draftData.poligono_coordenadas as any) || undefined,
        cidades: draftData.cidades || undefined,
        estados: draftData.estados || undefined,
      })

      // 3. Nicho
      formNicho.reset({
        nicho: draftData.nicho || '',
        categoria: draftData.categoria as any || undefined, // Type cast se necessário
      })

      // 4. Público Alvo
      if (draftData.publico_alvo) {
        formPublicoAlvo.setValue('publico_alvo', draftData.publico_alvo as any)
      }
      if (draftData.horarios_exibicao) {
        formPublicoAlvo.setValue('horarios_exibicao', draftData.horarios_exibicao as any)
      }
      if (draftData.dias_semana) {
        formPublicoAlvo.setValue('dias_semana', draftData.dias_semana)
      }

      // 5. Objetivos
      formObjetivos.reset({
        objetivo_principal: (draftData.objetivo_principal as any) || 'awareness',
        objetivos_secundarios: draftData.objetivos_secundarios || [],
        kpis_meta: draftData.kpis_meta || undefined,
        estrategia: (draftData.estrategia as any) || 'cpc',
        qr_code_link: draftData.qr_code_link || undefined,
        midias_urls: draftData.midias_urls || undefined,
      })

      // Lógica de Inferência de Passo (Resume Logic)
      const checkStep = async () => {
        // Valida passo 1 (Básico)
        const isBasicaValid = await formBasica.trigger()
        if (!isBasicaValid) {
          setCurrentStep(0)
          return
        }

        // Valida passo 2 (Localização)
        // Pequeno delay para garantir que o reset do formLocalizacao propagou
        const isLocalizacaoValid = await formLocalizacao.trigger()
        if (!isLocalizacaoValid) {
          setCurrentStep(1)
          return
        }

        // Valida passo 3 (Nicho)
        const isNichoValid = await formNicho.trigger()
        if (!isNichoValid) {
          setCurrentStep(2)
          return
        }

        // Valida passo 4 (Público)
        const isPublicoValid = await formPublicoAlvo.trigger()
        if (!isPublicoValid) {
          setCurrentStep(3)
          return
        }

        // Valida passo 5 (Objetivos)
        const isObjetivosValid = await formObjetivos.trigger()
        if (!isObjetivosValid) {
          setCurrentStep(4)
          return
        }

        // Se tudo estiver válido, vai para revisão
        setCurrentStep(5)
      }

      // Executa a verificação
      checkStep()

      toast.success('Rascunho carregado com sucesso!')
      setShowTemplateSelection(false) // Se carregou rascunho, esconde a seleção
    }
  }, [draftData, loadingDraft, formBasica, formLocalizacao, formNicho, formPublicoAlvo, formObjetivos])

  // Bloquear se empresa não estiver ativa (DEPOIS de todos os hooks)
  if (empresa?.status !== 'ativa') {
    return (
      <ProtectedRoute requiredUserType="empresa">
        <DashboardLayout>
          <Alert className="border-yellow-500/20 bg-yellow-500/5">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <AlertDescription>
              Sua conta precisa estar ativa para criar campanhas. Aguarde a aprovação da equipe Movello.
            </AlertDescription>
          </Alert>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredUserType="empresa">
      <DashboardLayout>
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/empresa/campanhas')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                  Nova Campanha
                </h1>
                <p className="text-lg text-muted-foreground">
                  Crie uma nova campanha de publicidade em 6 etapas
                </p>
              </div>
            </div>

            {/* Indicador de Auto-Save */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>
                    Salvo {lastSaved.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Salvamento automático ativo</span>
                </>
              )}
            </div>
          </motion.div>



          {showTemplateSelection ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in fade-in duration-500">
              <div className="text-center space-y-2 max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight">Como você deseja criar sua campanha?</h2>
                <p className="text-muted-foreground text-lg">
                  Escolha um modelo pré-configurado para economizar tempo ou comece do zero.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4">
                {/* Opção 1: Templates (Esquerda) */}
                <div className="space-y-4">
                  <Card className="h-full border-2 hover:border-primary/50 transition-all cursor-default bg-muted/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" x2="21" y1="9" y2="9" /><line x1="9" x2="9" y1="21" y2="9" /></svg>
                        </div>
                        Usar um Modelo
                      </CardTitle>
                      <CardDescription>
                        Recomendado. Melhores práticas já configuradas para o seu objetivo.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CampaignTemplates onSelectTemplate={handleApplyTemplate} />
                    </CardContent>
                  </Card>
                </div>

                {/* Opção 2: Manual (Direita) */}
                <Card
                  className="h-full border-2 hover:border-primary cursor-pointer transition-all group relative overflow-hidden"
                  onClick={() => setShowTemplateSelection(false)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-muted rounded-lg text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                      </div>
                      Criar Manualmente
                    </CardTitle>
                    <CardDescription>
                      Configure cada detalhe da sua campanha do zero.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" /><path d="M15 3v6h6" /><path d="M12 18v-6" /><path d="m9 15 3 3 3-3" /></svg>
                    </div>
                    <p className="text-sm text-muted-foreground px-8">
                      Você passará por todas as 6 etapas de configuração, definindo público, horários e criativos manualmente.
                    </p>
                    <Button className="mt-4" variant="default">Começar do Zero</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <CampaignWizard
              steps={steps}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
              onFinish={handleFinish}
              onSaveDraft={handleSaveDraft}
              isLoading={creating || salvandoRascunho}
              allowFreeNavigation={true}

            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
