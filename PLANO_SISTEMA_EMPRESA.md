# 📋 PLANO COMPLETO - SISTEMA EMPRESA

## 🎯 OBJETIVO
Estruturar e implementar completamente o sistema de empresas, permitindo que empresas aprovadas gerenciem campanhas, mídias, pagamentos, suporte e perfil de forma completa e funcional.

---

## 📊 ANÁLISE DO ESTADO ATUAL

### ✅ O QUE JÁ EXISTE:
1. **Páginas criadas (estrutura básica)**:
   - `/empresa/dashboard` - Dashboard básico com stats mockados
   - `/empresa/campanhas` - Lista de campanhas (usa hook inexistente)
   - `/empresa/campanhas/nova` - Formulário de criação (não funcional)
   - `/empresa/campanhas/[id]` - Detalhes da campanha (não funcional)
   - `/empresa/midias` - Página vazia
   - `/empresa/pagamentos` - Página vazia
   - `/empresa/perfil` - Página vazia
   - `/empresa/suporte` - Página vazia

2. **Banco de Dados**:
   - Tabela `campanhas` criada
   - Tabela `midias` criada
   - Tabela `campanha_metricas` criada
   - Tabela `pagamentos` criada
   - Tabela `tickets` criada
   - RLS policies básicas para campanhas

3. **Serviços**:
   - `campanhaService.ts` - Parcialmente implementado
   - `midiaService.ts` - Parcialmente implementado
   - `pagamentoService.ts` - Implementado (mas precisa adaptação para empresa)

### ❌ O QUE FALTA:
1. **Hooks específicos para empresa**:
   - `useEmpresaCampanhas` - Não existe
   - `useEmpresaMidias` - Não existe
   - `useEmpresaPagamentos` - Não existe
   - `useEmpresaTickets` - Não existe
   - `useEmpresaStats` - Não existe

2. **Funções SQL para empresa**:
   - `create_campanha` - Criar campanha
   - `update_campanha` - Atualizar campanha (própria)
   - `pause_campanha_empresa` - Pausar própria campanha
   - `get_empresa_stats` - Estatísticas da empresa
   - `get_empresa_campanhas` - Listar campanhas da empresa
   - `get_empresa_pagamentos` - Listar pagamentos da empresa
   - `create_ticket_empresa` - Criar ticket de suporte

3. **Páginas não funcionais**:
   - Todas as páginas precisam de integração com backend
   - Formulários precisam validação Zod completa
   - Upload de mídias não implementado
   - Visualização de métricas não implementada

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### FASE 1: INFRAESTRUTURA E FUNÇÕES SQL (Prioridade ALTA)

#### 1.1 Funções SQL para Campanhas
```sql
-- Criar campanha (empresa)
CREATE FUNCTION create_campanha_empresa(
    p_empresa_id UUID,
    p_titulo VARCHAR(255),
    p_descricao TEXT,
    p_orcamento DECIMAL(10,2),
    p_data_inicio DATE,
    p_data_fim DATE
) RETURNS UUID

-- Atualizar campanha (própria)
CREATE FUNCTION update_campanha_empresa(
    p_campanha_id UUID,
    p_empresa_id UUID,
    p_titulo VARCHAR(255),
    p_descricao TEXT,
    p_orcamento DECIMAL(10,2),
    p_data_inicio DATE,
    p_data_fim DATE
) RETURNS BOOLEAN

-- Pausar/Ativar campanha (própria)
CREATE FUNCTION toggle_campanha_empresa(
    p_campanha_id UUID,
    p_empresa_id UUID,
    p_action VARCHAR(20) -- 'pause' ou 'activate'
) RETURNS BOOLEAN

-- Listar campanhas da empresa
CREATE FUNCTION get_empresa_campanhas(
    p_empresa_id UUID,
    p_status VARCHAR(50) DEFAULT NULL
) RETURNS TABLE (...)
```

#### 1.2 Funções SQL para Estatísticas
```sql
-- Estatísticas da empresa
CREATE FUNCTION get_empresa_stats(
    p_empresa_id UUID
) RETURNS TABLE (
    total_campanhas BIGINT,
    campanhas_ativas BIGINT,
    campanhas_pendentes BIGINT,
    total_visualizacoes BIGINT,
    total_gasto DECIMAL(10,2),
    orcamento_total DECIMAL(10,2),
    saldo_disponivel DECIMAL(10,2)
)
```

#### 1.3 Funções SQL para Pagamentos
```sql
-- Listar pagamentos da empresa
CREATE FUNCTION get_empresa_pagamentos(
    p_empresa_id UUID,
    p_status VARCHAR(50) DEFAULT NULL
) RETURNS TABLE (...)
```

#### 1.4 RLS Policies Adicionais
- Empresas podem criar campanhas próprias
- Empresas podem atualizar campanhas próprias (apenas se não aprovada)
- Empresas podem pausar campanhas próprias ativas
- Empresas podem ver seus próprios pagamentos
- Empresas podem criar tickets

---

### FASE 2: HOOKS E SERVIÇOS (Prioridade ALTA)

#### 2.1 Hooks para Empresa
- `src/hooks/useEmpresaCampanhas.ts`
  - `useEmpresaCampanhas(filters)` - Listar campanhas
  - `useEmpresaCampanha(id)` - Detalhes de uma campanha
  - `useCreateCampanha()` - Criar campanha
  - `useUpdateCampanha()` - Atualizar campanha
  - `usePauseCampanha()` - Pausar campanha
  - `useActivateCampanha()` - Ativar campanha

- `src/hooks/useEmpresaMidias.ts`
  - `useEmpresaMidias(campanhaId)` - Listar mídias de uma campanha
  - `useUploadMidia()` - Upload de mídia
  - `useDeleteMidia()` - Deletar mídia
  - `useReorderMidias()` - Reordenar mídias

- `src/hooks/useEmpresaStats.ts`
  - `useEmpresaStats()` - Estatísticas gerais
  - `useCampanhaMetrics(campanhaId)` - Métricas de uma campanha

- `src/hooks/useEmpresaPagamentos.ts`
  - `useEmpresaPagamentos(filters)` - Listar pagamentos
  - `useCreatePagamento()` - Criar pagamento
  - `usePagamentoMethods()` - Métodos de pagamento

- `src/hooks/useEmpresaTickets.ts`
  - `useEmpresaTickets(filters)` - Listar tickets
  - `useEmpresaTicket(id)` - Detalhes de um ticket
  - `useCreateTicket()` - Criar ticket
  - `useAddTicketComment()` - Adicionar comentário

#### 2.2 Serviços para Empresa
- `src/services/empresaCampanhaService.ts`
  - `createCampanha(data)` - Criar campanha
  - `updateCampanha(id, data)` - Atualizar campanha
  - `pauseCampanha(id)` - Pausar campanha
  - `activateCampanha(id)` - Ativar campanha
  - `getCampanhas(filters)` - Listar campanhas
  - `getCampanha(id)` - Detalhes da campanha

- `src/services/empresaMidiaService.ts`
  - `uploadMidia(campanhaId, file, tipo)` - Upload de mídia
  - `deleteMidia(id)` - Deletar mídia
  - `reorderMidias(campanhaId, midias)` - Reordenar mídias
  - `getMidias(campanhaId)` - Listar mídias

- `src/services/empresaStatsService.ts`
  - `getStats()` - Estatísticas gerais
  - `getCampanhaMetrics(campanhaId, periodo)` - Métricas da campanha

- `src/services/empresaPagamentoService.ts`
  - `getPagamentos(filters)` - Listar pagamentos
  - `createPagamento(data)` - Criar pagamento
  - `getPaymentMethods()` - Métodos de pagamento disponíveis

---

### FASE 3: PÁGINAS E COMPONENTES (Prioridade ALTA)

#### 3.1 Dashboard (`/empresa/dashboard`)
**Funcionalidades:**
- Cards com estatísticas reais:
  - Total de campanhas
  - Campanhas ativas
  - Total de visualizações
  - Gasto total
  - Saldo disponível
  - Campanhas pendentes de aprovação
- Gráficos:
  - Evolução de visualizações (últimos 30 dias)
  - Distribuição de gastos por campanha
  - Performance de campanhas (top 5)
- Alertas proativos:
  - Campanhas próximas do fim
  - Orçamento baixo
  - Campanhas pendentes
- Ações rápidas:
  - Criar nova campanha
  - Ver campanhas pendentes
  - Adicionar saldo

**Componentes necessários:**
- `EmpresaStatsCards` - Cards de estatísticas
- `EmpresaCharts` - Gráficos de performance
- `EmpresaAlerts` - Alertas e notificações
- `QuickActions` - Ações rápidas

#### 3.2 Campanhas (`/empresa/campanhas`)
**Funcionalidades:**
- Lista de campanhas com DataTable
- Filtros:
  - Por status (todas, ativas, pausadas, em análise, aprovadas, reprovadas)
  - Por período (últimos 7 dias, 30 dias, 90 dias, customizado)
  - Por orçamento (faixas)
- Busca por nome/título
- Ações:
  - Ver detalhes
  - Editar (se não aprovada)
  - Pausar/Ativar (se ativa)
  - Duplicar campanha
  - Ver métricas
- Exportação (CSV, Excel)

**Melhorias:**
- Paginação eficiente
- Loading states
- Empty states informativos
- Refresh manual

#### 3.3 Nova Campanha (`/empresa/campanhas/nova`)
**Funcionalidades:**
- Formulário completo com validação Zod:
  - Título (obrigatório, min 3 caracteres)
  - Descrição (obrigatório, min 10 caracteres)
  - Orçamento (obrigatório, min R$ 100,00)
  - Data de início (obrigatório, >= hoje)
  - Data de fim (obrigatório, > data início)
  - Upload de mídias (opcional na criação)
- Preview da campanha
- Validação de saldo disponível
- Confirmação antes de criar

**Componentes:**
- `CampanhaForm` - Formulário completo
- `MidiaUploader` - Upload de mídias
- `CampanhaPreview` - Preview da campanha

#### 3.4 Detalhes da Campanha (`/empresa/campanhas/[id]`)
**Funcionalidades:**
- Informações da campanha:
  - Status com badge
  - Datas (início, fim, criação)
  - Orçamento (total, utilizado, disponível)
  - Progresso do orçamento (barra)
- Mídias:
  - Galeria de mídias
  - Upload de novas mídias
  - Reordenar mídias (drag & drop)
  - Deletar mídias
  - Preview de mídias
- Métricas:
  - Visualizações totais
  - Cliques
  - Conversões
  - Gasto por dia
  - Gráficos de performance
  - Comparação com período anterior
- Ações:
  - Editar (se não aprovada)
  - Pausar/Ativar (se ativa)
  - Duplicar
  - Exportar relatório
- Timeline de eventos:
  - Criação
  - Aprovação/Reprovação
  - Pausas/Ativações
  - Atualizações

**Componentes:**
- `CampanhaInfo` - Informações básicas
- `CampanhaMidias` - Gerenciador de mídias
- `CampanhaMetrics` - Métricas e gráficos
- `CampanhaTimeline` - Timeline de eventos
- `CampanhaActions` - Ações disponíveis

#### 3.5 Mídias (`/empresa/midias`)
**Funcionalidades:**
- Galeria de todas as mídias da empresa
- Filtros:
  - Por campanha
  - Por tipo (imagem, vídeo)
  - Por status (aprovada, em análise, reprovada)
- Upload em massa
- Visualização em grid/lista
- Ações:
  - Ver detalhes
  - Baixar
  - Deletar
  - Reutilizar em outra campanha

**Componentes:**
- `MidiaGallery` - Galeria de mídias
- `MidiaUploader` - Upload em massa
- `MidiaCard` - Card de mídia

#### 3.6 Pagamentos (`/empresa/pagamentos`)
**Funcionalidades:**
- Histórico de pagamentos:
  - Lista de pagamentos realizados
  - Status (pendente, processando, concluído, falhou)
  - Valores e datas
  - Comprovantes (se disponível)
- Adicionar saldo:
  - Formulário de pagamento
  - Seleção de método (PIX, Cartão, Boleto)
  - Validação de valores mínimos
  - Confirmação
- Métodos de pagamento:
  - Cadastrar novo método
  - Gerenciar métodos existentes
- Extrato financeiro:
  - Entradas (pagamentos)
  - Saídas (gastos em campanhas)
  - Saldo atual
  - Gráfico de movimentação

**Componentes:**
- `PagamentosList` - Lista de pagamentos
- `AdicionarSaldo` - Formulário de adicionar saldo
- `PaymentMethods` - Gerenciador de métodos
- `ExtratoFinanceiro` - Extrato e gráficos

#### 3.7 Perfil (`/empresa/perfil`)
**Funcionalidades:**
- Editar informações da empresa:
  - Razão social (readonly)
  - Nome fantasia
  - CNPJ (readonly)
  - Telefone comercial
  - Website
  - Instagram
  - Endereço completo
- Alterar senha:
  - Senha atual
  - Nova senha
  - Confirmar senha
- Upload de logo/avatar
- Notificações:
  - Preferências de notificação
  - Email de notificações
- Dados bancários (opcional):
  - Para repasses (se aplicável)

**Componentes:**
- `EmpresaProfileForm` - Formulário de perfil
- `ChangePasswordForm` - Alterar senha
- `NotificationSettings` - Configurações de notificação

#### 3.8 Suporte (`/empresa/suporte`)
**Funcionalidades:**
- Lista de tickets:
  - Meus tickets
  - Filtros por status, prioridade
  - Busca
- Criar novo ticket:
  - Assunto
  - Descrição
  - Prioridade
  - Anexos
- Detalhes do ticket:
  - Informações do ticket
  - Comentários
  - Timeline
  - Anexos
  - Adicionar comentário
  - Fechar ticket (se resolvido)

**Componentes:**
- `TicketsList` - Lista de tickets
- `CreateTicketForm` - Criar ticket
- `TicketDetails` - Detalhes do ticket (reutilizar do admin)

---

### FASE 4: COMPONENTES REUTILIZÁVEIS (Prioridade MÉDIA)

#### 4.1 Componentes de Campanha
- `CampanhaCard` - Card de campanha para listagem
- `CampanhaStatusBadge` - Badge de status
- `CampanhaBudgetBar` - Barra de progresso de orçamento
- `CampanhaMetricsChart` - Gráfico de métricas
- `CampanhaFilters` - Barra de filtros

#### 4.2 Componentes de Mídia
- `MidiaUploader` - Upload de mídias com preview
- `MidiaGallery` - Galeria de mídias
- `MidiaPreview` - Preview de mídia (modal)
- `MidiaReorder` - Reordenar mídias (drag & drop)

#### 4.3 Componentes de Pagamento
- `PaymentForm` - Formulário de pagamento
- `PaymentMethodCard` - Card de método de pagamento
- `PaymentHistory` - Histórico de pagamentos
- `BalanceCard` - Card de saldo

#### 4.4 Componentes de Estatísticas
- `StatsCard` - Card de estatística
- `StatsChart` - Gráfico de estatísticas
- `PerformanceChart` - Gráfico de performance

---

### FASE 5: VALIDAÇÕES E SEGURANÇA (Prioridade ALTA)

#### 5.1 Validações Zod
- Todos os formulários com validação completa
- Mensagens de erro em português
- Validação de valores monetários
- Validação de datas
- Validação de arquivos (tamanho, tipo)

#### 5.2 RLS Policies
- Empresas só podem ver suas próprias campanhas
- Empresas só podem criar campanhas para si
- Empresas só podem atualizar campanhas próprias não aprovadas
- Empresas só podem pausar campanhas próprias ativas
- Empresas só podem ver seus próprios pagamentos
- Empresas só podem criar tickets para si

#### 5.3 Permissões
- Verificar permissões antes de ações
- Mensagens de erro quando sem permissão
- Bloqueio de ações baseado em status

---

### FASE 6: OTIMIZAÇÕES (Prioridade MÉDIA)

#### 6.1 Performance
- Cache de estatísticas (5 minutos)
- Lazy loading de imagens
- Paginação eficiente
- Debounce em buscas
- Virtualização de listas longas

#### 6.2 UX
- Loading states consistentes
- Skeleton loaders
- Empty states informativos
- Error boundaries
- Confirmações para ações destrutivas
- Toast notifications
- Feedback visual em todas as ações

#### 6.3 Acessibilidade
- Labels adequados
- ARIA attributes
- Navegação por teclado
- Contraste adequado
- Screen reader support

---

### FASE 7: FUNCIONALIDADES AVANÇADAS (Prioridade BAIXA)

#### 7.1 Relatórios
- Relatórios de campanhas
- Exportação de dados
- Agendamento de relatórios

#### 7.2 Notificações
- Notificações de aprovação/reprovação
- Notificações de campanhas próximas do fim
- Notificações de saldo baixo
- Notificações de tickets

#### 7.3 Integrações
- API para integração externa
- Webhooks para eventos
- Exportação de dados

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### ✅ INFRAESTRUTURA
- [ ] Funções SQL para campanhas
- [ ] Funções SQL para estatísticas
- [ ] Funções SQL para pagamentos
- [ ] RLS policies completas
- [ ] Índices otimizados

### ✅ HOOKS E SERVIÇOS
- [ ] `useEmpresaCampanhas`
- [ ] `useEmpresaMidias`
- [ ] `useEmpresaStats`
- [ ] `useEmpresaPagamentos`
- [ ] `useEmpresaTickets`
- [ ] Serviços correspondentes

### ✅ PÁGINAS
- [ ] Dashboard completo
- [ ] Lista de campanhas funcional
- [ ] Criar campanha funcional
- [ ] Detalhes da campanha completo
- [ ] Mídias funcional
- [ ] Pagamentos funcional
- [ ] Perfil funcional
- [ ] Suporte funcional

### ✅ COMPONENTES
- [ ] Componentes de campanha
- [ ] Componentes de mídia
- [ ] Componentes de pagamento
- [ ] Componentes de estatísticas

### ✅ VALIDAÇÕES
- [ ] Validações Zod em todos os formulários
- [ ] Validação de permissões
- [ ] Validação de RLS

### ✅ OTIMIZAÇÕES
- [ ] Cache implementado
- [ ] Loading states
- [ ] Error handling
- [ ] Performance otimizada

---

## 🎯 PRIORIDADES DE IMPLEMENTAÇÃO

### 🔴 CRÍTICO (Fazer primeiro):
1. Funções SQL básicas (create, update, list campanhas)
2. Hook `useEmpresaCampanhas`
3. Página de lista de campanhas funcional
4. Página de criar campanha funcional
5. Dashboard com dados reais

### 🟡 IMPORTANTE (Fazer em seguida):
1. Detalhes da campanha completo
2. Upload de mídias
3. Página de pagamentos
4. Página de perfil
5. Página de suporte

### 🟢 DESEJÁVEL (Fazer depois):
1. Funcionalidades avançadas
2. Relatórios
3. Notificações
4. Integrações

---

## 📊 ESTIMATIVA DE ESFORÇO

- **Fase 1 (SQL)**: 4-6 horas
- **Fase 2 (Hooks/Serviços)**: 6-8 horas
- **Fase 3 (Páginas)**: 12-16 horas
- **Fase 4 (Componentes)**: 6-8 horas
- **Fase 5 (Validações)**: 4-6 horas
- **Fase 6 (Otimizações)**: 4-6 horas
- **Fase 7 (Avançado)**: 8-12 horas

**Total estimado**: 44-62 horas

---

## 🚀 PRÓXIMOS PASSOS

1. Criar migração SQL com todas as funções necessárias
2. Implementar hooks e serviços
3. Implementar páginas uma por uma
4. Testar cada funcionalidade
5. Otimizar e melhorar UX

---

## 📌 NOTAS IMPORTANTES

- Todas as ações devem respeitar RLS
- Validações devem ser tanto no frontend quanto no backend
- Mensagens de erro devem ser claras e em português
- Performance é crítica - usar cache quando possível
- UX deve ser intuitiva e consistente com o resto do sistema

