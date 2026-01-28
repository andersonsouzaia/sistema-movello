// ============================================
// TIPOS DO BANCO DE DADOS - MOVELLO
// ============================================

export type UserType = 'empresa' | 'motorista' | 'admin'

export type UserStatus = 'ativo' | 'inativo' | 'bloqueado' | 'suspenso'

export type EmpresaStatus = 'aguardando_aprovacao' | 'ativa' | 'bloqueada' | 'suspensa'

export type MotoristaStatus = 'aguardando_aprovacao' | 'aprovado' | 'bloqueado' | 'suspenso'

export type CampanhaStatus =
  | 'em_analise'
  | 'aprovada'
  | 'reprovada'
  | 'ativa'
  | 'pausada'
  | 'finalizada'
  | 'cancelada'
  | 'rascunho'

export type MidiaStatus = 'em_analise' | 'aprovada' | 'reprovada'

export type PagamentoStatus =
  | 'pendente'
  | 'processando'
  | 'pago'
  | 'falhou'
  | 'cancelado'
  | 'reembolsado'

export type RepasseStatus = 'pendente' | 'processando' | 'pago' | 'falhou'

export type GanhoTipo = 'exibicao' | 'bonus' | 'recompensa'

export type GanhoStatus = 'pendente' | 'processando' | 'pago' | 'falhou'

export type TabletStatus = 'disponivel' | 'vinculado' | 'manutencao'

export type TicketStatus = 'aberto' | 'em_andamento' | 'resolvido' | 'fechado'

export type TicketPrioridade = 'baixa' | 'media' | 'alta' | 'urgente'

// ============================================
// TIPOS DE ROLES E PERMISSÕES
// ============================================

export type RoleSlug = 'super_admin' | 'admin' | 'suporte' | 'empresa' | 'motorista'

export interface Role {
  id: string
  name: string
  slug: RoleSlug
  description: string | null
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  name: string
  slug: string
  resource: string
  action: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface RolePermission {
  role_id: string
  permission_id: string
  created_at: string
}

// ============================================
// INTERFACES PRINCIPAIS
// ============================================

export interface User {
  id: string
  tipo: UserType
  email: string
  nome: string | null
  telefone: string | null
  avatar_url: string | null
  status: UserStatus
  ultimo_acesso: string | null
  created_at: string
  updated_at: string
}

export interface Empresa {
  id: string
  cnpj: string
  razao_social: string
  nome_fantasia: string | null
  instagram: string | null
  website: string | null
  telefone_comercial: string | null
  endereco: Record<string, any> | null
  status: EmpresaStatus
  motivo_bloqueio: string | null
  aprovado_por: string | null
  aprovado_em: string | null
  created_at: string
  updated_at: string
}

export interface Motorista {
  id: string
  cpf: string
  rg: string | null
  data_nascimento: string | null
  telefone: string
  veiculo: string
  placa: string
  modelo_veiculo: string | null
  cor_veiculo: string | null
  ano_veiculo: number | null
  endereco: Record<string, any> | null
  banco: string | null
  agencia: string | null
  conta: string | null
  pix: string | null
  status: MotoristaStatus
  motivo_bloqueio: string | null
  tablet_id: string | null
  aprovado_por: string | null
  aprovado_em: string | null
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  nivel_acesso: 'admin' | 'super_admin' | 'suporte'
  departamento: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface LoginAttempt {
  id: string
  user_id: string | null
  email: string
  tentativas: number
  ultima_tentativa: string | null
  bloqueado_ate: string | null
  nivel_bloqueio: number
  created_at: string
  updated_at: string
}

export interface LoginAttemptResult {
  bloqueado: boolean
  tentativas?: number
  tentativas_restantes?: number
  tempo_restante_segundos?: number
  tempo_restante_minutos?: number
  nivel_bloqueio?: number
  mensagem?: string
}

// ============================================
// TIPOS PARA FORMULÁRIOS
// ============================================

export interface CadastroEmpresaFormData {
  cnpj: string
  razao_social: string
  nome_fantasia?: string
  instagram?: string
  email: string
  confirmar_email: string
  senha: string
  confirmar_senha: string
  aceitar_termos: boolean
}

export interface CadastroMotoristaFormData {
  cpf: string
  nome: string
  telefone: string
  email: string
  confirmar_email: string
  senha: string
  confirmar_senha: string
  veiculo: string
  placa: string
  aceitar_termos: boolean
}

export interface LoginFormData {
  email: string
  senha: string
}

export interface RecuperarSenhaFormData {
  email: string
}

export interface RedefinirSenhaFormData {
  senha: string
  confirmar_senha: string
}

export interface ConfirmarEmailFormData {
  codigo: string
}

// ============================================
// TIPOS PARA AUDIT LOG E NOTIFICAÇÕES
// ============================================

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  details: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  link: string | null
  read: boolean
  created_at: string
}

export interface UserWithRoles extends User {
  roles: Role[]
  permissions: string[]
}

// ============================================
// TIPOS PARA FORMULÁRIOS ADMINISTRATIVOS
// ============================================

export interface CreateUserFormData {
  nome: string
  email: string
  senha: string
  confirmar_senha: string
  role_slug: RoleSlug
}

export interface UpdateUserRoleFormData {
  user_id: string
  role_slug: RoleSlug
  is_primary?: boolean
}

// ============================================
// INTERFACES PARA CAMPANHAS
// ============================================

export type LocalizacaoTipo = 'raio' | 'poligono' | 'cidade' | 'estado' | 'regiao'
export type ObjetivoPrincipal = 'awareness' | 'consideracao' | 'conversao' | 'retencao' | 'engajamento'
export type Estrategia = 'cpc' | 'cpm' | 'cpa' | 'cpl'
export type Genero = 'M' | 'F' | 'Outro' | 'Todos'
export type CategoriaCampanha = 'News' | 'Food' | 'Saúde' | 'Jogos' | 'Kids' | 'Shopping' | 'Turismo' | 'Fitness' | 'Educação'

export interface CampanhaLocalizacao {
  tipo: LocalizacaoTipo
  raio_km?: number
  centro_latitude?: number
  centro_longitude?: number
  poligono_coordenadas?: Array<[number, number]> // [[lat, lng], ...]
  cidades?: string[]
  estados?: string[]
  regioes?: string[]
  areas_especificas?: Array<{
    nome: string
    lat: number
    lng: number
    raio: number
  }>
  excluir_areas?: Array<{
    nome: string
    lat: number
    lng: number
    raio: number
  }>
}

export interface PublicoAlvo {
  idade_min?: number
  idade_max?: number
  genero?: Genero[]
  interesses?: string[]
}

export interface HorarioExibicao {
  [dia: string]: {
    inicio: string // HH:mm
    fim: string // HH:mm
  }
}

export interface KPIsMeta {
  visualizacoes?: number
  cliques?: number
  conversoes?: number
  ctr?: number // Taxa de clique
  cpc?: number // Custo por clique
  roi?: number // ROI
}

export interface Campanha {
  id: string
  empresa_id: string
  titulo: string
  descricao: string | null
  orcamento: number
  orcamento_utilizado: number
  data_inicio: string
  data_fim: string
  horario_inicio?: string
  horario_fim?: string
  status: CampanhaStatus
  aprovado_por: string | null
  aprovado_em: string | null
  motivo_reprovacao: string | null
  criado_em: string
  atualizado_em: string
  // Campos de geolocalização
  localizacao_tipo?: LocalizacaoTipo
  raio_km?: number
  centro_latitude?: number
  centro_longitude?: number
  poligono_coordenadas?: Array<[number, number]>
  cidades?: string[]
  estados?: string[]
  regioes?: string[]
  areas_especificas?: Array<{
    nome: string
    lat: number
    lng: number
    raio: number
  }>
  excluir_areas?: Array<{
    nome: string
    lat: number
    lng: number
    raio: number
  }>
  // Campos de nicho
  nicho?: string
  categoria?: CategoriaCampanha
  categorias?: string[] // Deprecated but kept for compatibility
  // Campos de público-alvo
  publico_alvo?: PublicoAlvo
  horarios_exibicao?: HorarioExibicao
  dias_semana?: number[] // [1,2,3,4,5] = Segunda a Sexta
  // Campos de objetivos
  objetivo_principal?: ObjetivoPrincipal
  objetivos_secundarios?: string[]
  kpis_meta?: KPIsMeta
  estrategia?: Estrategia
  // Campos de rascunho
  is_rascunho?: boolean
  saldo_insuficiente?: boolean
  rascunho_salvo_em?: string
  // Campos de mídia e QR Code
  qr_code_link?: string
  midias_urls?: string[]
}

export interface Midia {
  id: string
  campanha_id: string
  tipo: 'imagem' | 'video'
  url: string
  thumbnail_url: string | null
  status: MidiaStatus
  aprovado_por: string | null
  aprovado_em: string | null
  motivo_reprovacao: string | null
  ordem: number
  criado_em: string
}

export interface CampanhaMetrica {
  id: string
  campanha_id: string
  data: string
  visualizacoes: number
  cliques: number
  conversoes: number
  valor_gasto: number
  criado_em: string
  // Campos expandidos
  impressoes?: number
  tempo_medio_visualizacao?: number
  taxa_rejeicao?: number
  alcance?: number
  engajamento?: number
}

export interface CampanhaMetricasConsolidadas {
  total_visualizacoes: number
  total_cliques: number
  total_conversoes: number
  total_gasto: number
  total_impressoes: number
  ctr: number
  cpc: number
  cpm: number
  cpa: number
  taxa_conversao: number
  tempo_medio_visualizacao: number
}

export interface MetricaDiaria {
  data: string
  visualizacoes: number
  gasto: number
  cliques: number
  conversoes: number
  impressoes?: number
  ctr?: number
  cpc?: number
}

export interface CampanhaWithEmpresa extends Campanha {
  empresa?: {
    nome: string
    razao_social: string
  }
}

export interface AreaFavorita {
  id: string
  empresa_id: string
  nome: string
  localizacao_tipo: LocalizacaoTipo
  raio_km?: number
  centro_latitude?: number
  centro_longitude?: number
  poligono_coordenadas?: Array<[number, number]>
  cidades?: string[]
  estados?: string[]
  regioes?: string[]
  criado_em: string
  atualizado_em: string
}

export interface CampanhaTemplate {
  id: string
  empresa_id: string | null
  nome: string
  descricao: string | null
  nicho?: string
  categorias?: string[]
  publico_alvo?: PublicoAlvo
  horarios_exibicao?: HorarioExibicao
  dias_semana?: number[]
  objetivo_principal?: ObjetivoPrincipal
  objetivos_secundarios?: string[]
  estrategia?: Estrategia
  localizacao_tipo?: LocalizacaoTipo
  raio_km?: number
  centro_latitude?: number
  centro_longitude?: number
  poligono_coordenadas?: Array<[number, number]>
  cidades?: string[]
  estados?: string[]
  regioes?: string[]
  criado_em: string
  atualizado_em: string
}

export interface NichoCategoria {
  id: string
  nicho: string
  categoria: string
  descricao: string | null
  icone: string | null
  ordem: number
  criado_em: string
}

// ============================================
// INTERFACES PARA TICKETS
// ============================================

export interface Ticket {
  id: string
  empresa_id: string | null
  motorista_id: string | null
  titulo: string
  descricao: string
  status: TicketStatus
  prioridade: TicketPrioridade
  atribuido_a: string | null
  criado_por: string
  resolvido_por: string | null
  resolvido_em: string | null
  tempo_resposta: string | null
  tempo_resolucao: string | null
  criado_em: string
  atualizado_em: string
}

export interface TicketComentario {
  id: string
  ticket_id: string
  user_id: string
  comentario: string
  anexos: Array<{ url: string; nome: string }>
  interno: boolean
  criado_em: string
  user?: {
    id: string
    nome: string
  }
}

export interface Tag {
  id: string
  nome: string
  cor: string
  tipo_recurso: 'tickets' | 'campanhas' | 'ambos'
  criado_em: string
}

export interface TicketWithDetails extends Ticket {
  empresa?: {
    id: string
    razao_social: string
    nome_fantasia?: string
  }
  motorista?: {
    id: string
    user_nome: string
  }
  atribuido?: {
    id: string
    nome: string
  }
  criado_por_user?: {
    id: string
    nome: string
  }
  resolvido_por_user?: {
    id: string
    nome: string
  }
  tags?: Tag[]
}

// ============================================
// INTERFACES PARA PAGAMENTOS
// ============================================

export interface Pagamento {
  id: string
  empresa_id: string
  campanha_id: string | null
  valor: number
  taxa_comissao: number
  valor_liquido: number
  status: PagamentoStatus
  metodo_pagamento: string | null
  referencia_externa: string | null
  processado_em: string | null
  processado_por: string | null
  erro_mensagem: string | null
  criado_em: string
  atualizado_em: string
}

export interface Repasse {
  id: string
  motorista_id: string
  campanha_id: string | null
  valor: number
  taxa_comissao: number
  valor_liquido: number
  status: RepasseStatus
  metodo_pagamento: string | null
  referencia_externa: string | null
  processado_em: string | null
  processado_por: string | null
  erro_mensagem: string | null
  criado_em: string
  atualizado_em: string
}

export interface Transacao {
  id: string
  tipo: 'pagamento' | 'repasse' | 'ajuste'
  origem_id: string | null
  destino_id: string | null
  valor: number
  status: 'pendente' | 'processando' | 'concluida' | 'falhou' | 'cancelada'
  descricao: string | null
  referencia_pagamento: string | null
  referencia_repasse: string | null
  criado_em: string
}

// ============================================
// INTERFACES PARA GANHOS DE MOTORISTAS
// ============================================

export interface Ganho {
  id: string
  motorista_id: string
  valor: number
  descricao: string
  tipo: GanhoTipo
  status: GanhoStatus
  data_exibicao: string
  campanha_id: string | null
  processado_em: string | null
  processado_por: string | null
  erro_mensagem: string | null
  criado_em: string
  updated_at: string
}

export interface GanhoStats {
  ganhos_hoje: number
  ganhos_mes: number
  total_pendente: number
  total_pago: number
  total_ganhos: number
}

export interface GanhoMensal {
  mes: number
  mes_nome: string
  valor: number
}

// ============================================
// INTERFACES PARA TABLETS
// ============================================

export interface Tablet {
  id: string
  modelo: string | null
  serial_number: string | null
  status: TabletStatus
  motorista_id: string | null
  ultima_conexao: string | null
  criado_em: string
  updated_at: string
}

export interface FinancialSummary {
  total_receitas: number
  total_despesas: number
  saldo: number
  pagamentos_pendentes: number
  repasses_pendentes: number
}

// ============================================
// INTERFACES PARA CONFIGURAÇÕES
// ============================================

export interface Configuracao {
  chave: string
  valor: string | number | boolean | Record<string, any>
  tipo: 'string' | 'number' | 'boolean' | 'json'
  descricao: string | null
  categoria: string
  editavel: boolean
  criado_em: string
  atualizado_em: string
}

export interface TemplateEmail {
  id: string
  nome: string
  assunto: string
  corpo_html: string
  corpo_texto: string | null
  variaveis: string[]
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface Automatizacao {
  id: string
  nome: string
  trigger_evento: string
  condicoes: Record<string, any>
  acoes: Record<string, any>
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

// ============================================
// TIPOS PARA FORMULÁRIOS ADMINISTRATIVOS
// ============================================

export interface CreateCampanhaFormData {
  titulo: string
  descricao: string
  orcamento: number
  data_inicio: string
  data_fim: string
  horario_inicio?: string
  horario_fim?: string
}

export interface UpdateCampanhaFormData {
  titulo?: string
  descricao?: string
  orcamento?: number
  data_inicio?: string
  data_fim?: string
  horario_inicio?: string
  horario_fim?: string
}

export interface CreateTicketFormData {
  empresa_id?: string
  motorista_id?: string
  titulo: string
  descricao: string
  prioridade: TicketPrioridade
}

export interface UpdateTicketFormData {
  titulo?: string
  descricao?: string
  status?: TicketStatus
  prioridade?: TicketPrioridade
  atribuido_a?: string
}

export interface CreateTagFormData {
  nome: string
  cor: string
  tipo_recurso: 'tickets' | 'campanhas' | 'ambos'
}

export interface ProcessPaymentFormData {
  referencia_externa?: string
}

export interface ProcessRepasseFormData {
  referencia_externa?: string
}

export interface UpdateConfiguracaoFormData {
  valor: string | number | boolean | Record<string, any>
}

// ============================================
// TIPOS PARA RESPOSTAS DE FUNÇÕES SQL
// ============================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      empresas: {
        Row: Empresa
        Insert: Omit<Empresa, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Empresa, 'id' | 'created_at' | 'updated_at'>>
      }
      motoristas: {
        Row: Motorista
        Insert: Omit<Motorista, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Motorista, 'id' | 'created_at' | 'updated_at'>>
      }
      admins: {
        Row: Admin
        Insert: Omit<Admin, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Admin, 'id' | 'created_at' | 'updated_at'>>
      }
      login_attempts: {
        Row: LoginAttempt
        Insert: Omit<LoginAttempt, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<LoginAttempt, 'id' | 'created_at' | 'updated_at'>>
      }
      roles: {
        Row: Role
        Insert: Omit<Role, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Role, 'id' | 'created_at' | 'updated_at'>>
      }
      permissions: {
        Row: Permission
        Insert: Omit<Permission, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Permission, 'id' | 'created_at' | 'updated_at'>>
      }
      user_roles: {
        Row: UserRole
        Insert: Omit<UserRole, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserRole, 'id' | 'created_at' | 'updated_at'>>
      }
      role_permissions: {
        Row: RolePermission
        Insert: Omit<RolePermission, 'created_at'>
        Update: Partial<Omit<RolePermission, 'created_at'>>
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: Partial<Omit<AuditLog, 'id' | 'created_at'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at' | 'read'>
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>
      }
      campanhas: {
        Row: Campanha
        Insert: Omit<Campanha, 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Omit<Campanha, 'id' | 'criado_em' | 'atualizado_em'>>
      }
      midias: {
        Row: Midia
        Insert: Omit<Midia, 'id' | 'criado_em'>
        Update: Partial<Omit<Midia, 'id' | 'criado_em'>>
      }
      campanha_metricas: {
        Row: CampanhaMetrica
        Insert: Omit<CampanhaMetrica, 'id' | 'criado_em'>
        Update: Partial<Omit<CampanhaMetrica, 'id' | 'criado_em'>>
      }
      tickets: {
        Row: Ticket
        Insert: Omit<Ticket, 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Omit<Ticket, 'id' | 'criado_em' | 'atualizado_em'>>
      }
      ticket_comentarios: {
        Row: TicketComentario
        Insert: Omit<TicketComentario, 'id' | 'criado_em'>
        Update: Partial<Omit<TicketComentario, 'id' | 'criado_em'>>
      }
      tags: {
        Row: Tag
        Insert: Omit<Tag, 'id' | 'criado_em'>
        Update: Partial<Omit<Tag, 'id' | 'criado_em'>>
      }
      ticket_tags: {
        Row: { ticket_id: string; tag_id: string }
        Insert: { ticket_id: string; tag_id: string }
        Update: never
      }
      pagamentos: {
        Row: Pagamento
        Insert: Omit<Pagamento, 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Omit<Pagamento, 'id' | 'criado_em' | 'atualizado_em'>>
      }
      repasses: {
        Row: Repasse
        Insert: Omit<Repasse, 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Omit<Repasse, 'id' | 'criado_em' | 'atualizado_em'>>
      }
      transacoes: {
        Row: Transacao
        Insert: Omit<Transacao, 'id' | 'criado_em'>
        Update: Partial<Omit<Transacao, 'id' | 'criado_em'>>
      }
      configuracoes: {
        Row: Configuracao
        Insert: Omit<Configuracao, 'criado_em' | 'atualizado_em'>
        Update: Partial<Omit<Configuracao, 'criado_em' | 'atualizado_em'>>
      }
      templates_email: {
        Row: TemplateEmail
        Insert: Omit<TemplateEmail, 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Omit<TemplateEmail, 'id' | 'criado_em' | 'atualizado_em'>>
      }
      automatizacoes: {
        Row: Automatizacao
        Insert: Omit<Automatizacao, 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Omit<Automatizacao, 'id' | 'criado_em' | 'atualizado_em'>>
      }
    }
    Functions: {
      registrar_tentativa_login: {
        Args: {
          p_email: string
          p_user_id?: string | null
        }
        Returns: LoginAttemptResult
      }
      resetar_tentativas_login: {
        Args: {
          p_user_id: string
        }
        Returns: void
      }
      calcular_tempo_bloqueio: {
        Args: {
          nivel: number
        }
        Returns: string
      }
      has_permission: {
        Args: {
          p_user_id: string
          p_permission_slug: string
        }
        Returns: boolean
      }
      get_user_roles: {
        Args: {
          p_user_id: string
        }
        Returns: Array<{
          role_id: string
          role_name: string
          role_slug: string
          is_primary: boolean
        }>
      }
      get_user_permissions: {
        Args: {
          p_user_id: string
        }
        Returns: Array<{
          permission_slug: string
        }>
      }
      assign_role_to_user: {
        Args: {
          p_user_id: string
          p_role_slug: string
          p_is_primary?: boolean
        }
        Returns: boolean
      }
      remove_role_from_user: {
        Args: {
          p_user_id: string
          p_role_slug: string
        }
        Returns: boolean
      }
      create_first_admin: {
        Args: {
          p_email: string
          p_password: string
          p_nome: string
        }
        Returns: string
      }
      has_admin: {
        Args: {}
        Returns: boolean
      }
      create_admin_user: {
        Args: {
          p_email: string
          p_password: string
          p_nome: string
          p_role_slug: string
          p_admin_id: string
        }
        Returns: string
      }
      log_action: {
        Args: {
          p_user_id: string
          p_action: string
          p_resource_type: string
          p_resource_id?: string | null
          p_details?: Record<string, any> | null
          p_ip_address?: string | null
          p_user_agent?: string | null
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_message: string
          p_link?: string | null
        }
        Returns: string
      }
      get_advanced_stats: {
        Args: {}
        Returns: Array<{
          empresas_crescimento_30d: number
          motoristas_crescimento_30d: number
          empresas_aprovadas_30d: number
          motoristas_aprovados_30d: number
          total_acoes_hoje: number
          notificacoes_nao_lidas: number
        }>
      }
      approve_campanha: {
        Args: {
          p_campanha_id: string
          p_admin_id: string
        }
        Returns: boolean
      }
      reject_campanha: {
        Args: {
          p_campanha_id: string
          p_admin_id: string
          p_motivo: string
        }
        Returns: boolean
      }
      pause_campanha: {
        Args: {
          p_campanha_id: string
          p_admin_id: string
        }
        Returns: boolean
      }
      activate_campanha: {
        Args: {
          p_campanha_id: string
          p_admin_id: string
        }
        Returns: boolean
      }
      approve_midia: {
        Args: {
          p_midia_id: string
          p_admin_id: string
        }
        Returns: boolean
      }
      reject_midia: {
        Args: {
          p_midia_id: string
          p_admin_id: string
          p_motivo: string
        }
        Returns: boolean
      }
      assign_ticket: {
        Args: {
          p_ticket_id: string
          p_admin_id: string
        }
        Returns: boolean
      }
      resolve_ticket: {
        Args: {
          p_ticket_id: string
          p_admin_id: string
        }
        Returns: boolean
      }
      close_ticket: {
        Args: {
          p_ticket_id: string
          p_admin_id: string
        }
        Returns: boolean
      }
      add_ticket_comment: {
        Args: {
          p_ticket_id: string
          p_user_id: string
          p_comentario: string
          p_anexos?: Record<string, any>
          p_interno?: boolean
        }
        Returns: string
      }
      process_payment: {
        Args: {
          p_pagamento_id: string
          p_admin_id: string
          p_referencia_externa?: string
        }
        Returns: boolean
      }
      process_repasse: {
        Args: {
          p_repasse_id: string
          p_admin_id: string
          p_referencia_externa?: string
        }
        Returns: boolean
      }
      retry_failed_payment: {
        Args: {
          p_pagamento_id: string
          p_admin_id: string
        }
        Returns: boolean
      }
      get_financial_summary: {
        Args: {
          p_data_inicio?: string
          p_data_fim?: string
        }
        Returns: Array<FinancialSummary>
      }
    }
  }
}

