# Funcionalidades Faltantes e Melhorias Necessárias

Baseado na análise do `GUIA_TESTES_INTEGRACAO.md`, este documento lista tudo que precisa ser implementado ou corrigido no sistema.

> **Nota**: Muitas funcionalidades já foram implementadas ou verificadas. Veja `IMPLEMENTACOES_CONCLUIDAS.md` para detalhes.

---

## 🔴 CRÍTICO - Funcionalidades Faltantes

### 1. Sistema de Viagens para Motoristas
**Localização**: `src/pages/motorista/Dashboard.tsx` linha 63  
**Status**: ⚠️ TODO identificado  
**Descrição**: O card "Viagens Realizadas" está hardcoded com valor "0"

**O que precisa ser feito**:
- [ ] Criar tabela `viagens` no banco de dados
- [ ] Criar migration SQL para sistema de viagens
- [ ] Criar service `viagemService.ts`
- [ ] Criar hook `useMotoristaViagens.ts`
- [ ] Integrar contagem de viagens no Dashboard do motorista
- [ ] Criar página `/motorista/viagens` para histórico

**Critérios de Aceitação**:
- Motorista vê contagem real de viagens realizadas
- Histórico de viagens disponível
- Viagens vinculadas a campanhas

---

### 2. Visualização de Campanhas Disponíveis para Motoristas
**Localização**: Não existe  
**Status**: ❌ Não implementado  
**Descrição**: Motoristas precisam visualizar campanhas disponíveis para participar

**O que precisa ser feito**:
- [ ] Criar página `/motorista/campanhas` ou `/motorista/campanhas-disponiveis`
- [ ] Criar hook `useCampanhasDisponiveis.ts` que busca campanhas ativas
- [ ] Criar componente de listagem de campanhas para motoristas
- [ ] Adicionar link no menu de navegação do motorista
- [ ] Implementar filtros (por localização, valor, etc.)

**Critérios de Aceitação**:
- Motorista vê lista de campanhas ativas
- Pode filtrar por localização
- Pode ver detalhes da campanha
- Sistema de busca funciona

---

### 3. RequirePermission no Admin Dashboard
**Localização**: `src/pages/admin/Dashboard.tsx`  
**Status**: ⚠️ Problema conhecido (linha 43 do guia)  
**Descrição**: Admin Dashboard usa apenas `ProtectedRoute`, mas deveria usar `RequirePermission` para verificação granular

**O que precisa ser feito**:
- [ ] Envolver seções do dashboard com `RequirePermission`
- [ ] Adicionar verificação de permissões específicas:
  - `empresas.read` para ver empresas pendentes
  - `motoristas.read` para ver motoristas pendentes
  - `campanhas.read` para ver campanhas pendentes
  - `pagamentos.read` para ver resumo financeiro
  - `suporte.read` para ver tickets

**Critérios de Aceitação**:
- Cada seção verifica permissão específica
- Usuários sem permissão não veem seções restritas
- Mensagens apropriadas são exibidas

---

## 🟡 MÉDIO - Melhorias e Correções

### 4. Remover Instrumentação de Debug
**Localização**: `src/pages/motorista/Dashboard.tsx` linhas 21-25  
**Status**: ⚠️ Debug presente (mencionado no guia linha 325)  
**Descrição**: Código de debug enviando dados para endpoint externo

**O que precisa ser feito**:
- [ ] Remover bloco `#region agent log` e `#endregion`
- [ ] Remover `useEffect` que faz fetch para endpoint de debug
- [ ] Verificar se há outros lugares com código de debug similar

---

### 5. Sistema de Notificações - Verificação Completa
**Localização**: Múltiplos lugares  
**Status**: ⚠️ Precisa verificação  
**Descrição**: Verificar se notificações estão sendo enviadas corretamente em todos os fluxos

**Fluxos a verificar**:
- [ ] Aprovação de empresa → notificação enviada
- [ ] Aprovação de motorista → notificação enviada
- [ ] Aprovação de campanha → notificação enviada
- [ ] Resposta a ticket → notificação enviada
- [ ] Bloqueio/suspensão → notificação enviada

**O que precisa ser feito**:
- [ ] Revisar todos os serviços que fazem aprovações
- [ ] Verificar se `notificationService` está sendo chamado
- [ ] Testar envio de notificações em cada fluxo
- [ ] Adicionar logs para debug se necessário

---

### 6. Feed de Atividades - Verificação
**Localização**: `src/components/admin/ActivityFeed.tsx`  
**Status**: ✅ Existe, mas precisa verificação  
**Descrição**: Verificar se feed de atividades está funcionando corretamente

**O que precisa ser feito**:
- [ ] Verificar se `useRecentActivity` está retornando dados
- [ ] Verificar se `audit_logs` está sendo populado corretamente
- [ ] Testar se atividades aparecem após ações do admin
- [ ] Verificar se filtros funcionam

---

### 7. Páginas Admin - Verificação de Funcionalidade
**Localização**: Várias páginas admin  
**Status**: ✅ Existem, mas precisam verificação

**Páginas a verificar**:
- [ ] `/admin/roles` - Gestão de roles e permissões funciona?
- [ ] `/admin/logs` - Logs são exibidos corretamente?
- [ ] `/admin/relatorios` - Relatórios são gerados?
- [ ] `/admin/notificacoes` - Notificações são gerenciadas?

**O que precisa ser feito**:
- [ ] Testar cada página manualmente
- [ ] Verificar se dados são carregados
- [ ] Verificar se ações funcionam (criar, editar, deletar)
- [ ] Verificar permissões em cada página

---

## 🟢 BAIXO - Melhorias de UX/Performance

### 8. Otimização de Múltiplas Chamadas de Hooks
**Localização**: `src/pages/admin/Dashboard.tsx`  
**Status**: ⚠️ Problema conhecido (linha 44 do guia)  
**Descrição**: Múltiplas chamadas de hooks podem afetar performance

**O que precisa ser feito**:
- [ ] Analisar quantas chamadas estão sendo feitas
- [ ] Implementar cache onde apropriado
- [ ] Considerar usar `useQueries` do React Query para batch requests
- [ ] Adicionar debounce onde necessário

---

### 9. Gráficos no Dashboard Motorista
**Localização**: `src/pages/motorista/Ganhos.tsx`  
**Status**: ⚠️ Mencionado no guia (linha 333)  
**Descrição**: Verificar se gráficos estão sendo exibidos na página de ganhos

**O que precisa ser feito**:
- [ ] Verificar se gráficos existem na página
- [ ] Se não existem, implementar gráficos de ganhos
- [ ] Adicionar gráfico de evolução mensal
- [ ] Adicionar gráfico de ganhos por tipo

---

### 10. Métodos de Pagamento - Empresa
**Localização**: `src/pages/empresa/Pagamentos.tsx`  
**Status**: ⚠️ Mencionado no guia (linha 262)  
**Descrição**: Verificar se empresa pode adicionar métodos de pagamento

**O que precisa ser feito**:
- [ ] Verificar se funcionalidade existe
- [ ] Se não existe, implementar formulário para adicionar métodos
- [ ] Integrar com gateway de pagamento (se aplicável)
- [ ] Validar dados de pagamento

---

## 📋 Checklist de Verificação por Módulo

### Admin Dashboard
- [x] Estatísticas carregam
- [x] Gráficos são renderizados
- [x] Listas de pendências aparecem
- [ ] Notificações são exibidas (verificar)
- [x] Feed de atividades funciona (verificar dados)
- [ ] RequirePermission implementado

### Gestão de Empresas
- [x] Lista de empresas carrega
- [x] Aprovação funciona
- [ ] Notificação é enviada (verificar)
- [x] Detalhes da empresa são exibidos
- [x] Bloqueio/suspensão funcionam
- [ ] Permissões são verificadas (RequirePermission)

### Gestão de Motoristas
- [x] Lista de motoristas carrega
- [x] Aprovação funciona
- [ ] Notificação é enviada (verificar)
- [x] Detalhes do motorista são exibidos
- [x] Bloqueio/suspensão funcionam
- [ ] Permissões são verificadas (RequirePermission)

### Gestão de Campanhas
- [x] Lista de campanhas carrega
- [x] Filtros funcionam
- [x] Aprovação/rejeição funcionam
- [ ] Notificação é enviada (verificar)
- [x] Detalhes da campanha são exibidos
- [ ] Permissões são verificadas (RequirePermission)

### Dashboard Motorista
- [x] Estatísticas de ganhos carregam
- [x] Status badge é exibido
- [x] Status do tablet é exibido
- [x] Links funcionam
- [ ] Sistema de viagens implementado
- [ ] Visualização de campanhas disponíveis

### Dashboard Empresa
- [x] Estatísticas carregam
- [x] Gráficos são exibidos
- [x] Mapa carrega
- [x] Campanhas são listadas
- [x] Métricas são atualizadas
- [x] Status badge é exibido

---

## 🎯 Priorização

### Prioridade ALTA (Implementar Primeiro)
1. **Sistema de Viagens** - Funcionalidade crítica para motoristas
2. **Visualização de Campanhas para Motoristas** - Funcionalidade essencial
3. **RequirePermission no Admin Dashboard** - Segurança

### Prioridade MÉDIA
4. **Remover Debug Code** - Limpeza de código
5. **Verificar Notificações** - Funcionalidade importante
6. **Verificar Páginas Admin** - Garantir que tudo funciona

### Prioridade BAIXA
7. **Otimização de Performance** - Melhoria incremental
8. **Gráficos no Dashboard Motorista** - Melhoria visual
9. **Métodos de Pagamento** - Funcionalidade adicional

---

## 📝 Notas de Implementação

### Para Sistema de Viagens
- Considerar criar tabela `viagens` com campos:
  - `id`, `motorista_id`, `campanha_id`, `data_inicio`, `data_fim`
  - `localizacao_inicio`, `localizacao_fim`, `distancia_km`
  - `valor_ganho`, `status`, `criado_em`
- Criar RLS policies apropriadas
- Criar funções SQL para estatísticas

### Para Campanhas Disponíveis
- Criar hook que busca campanhas com `status = 'ativa'`
- Filtrar por localização do motorista (se aplicável)
- Mostrar informações relevantes: valor, localização, período
- Permitir que motorista "aceite" campanha (se necessário)

### Para RequirePermission
- Envolver cada seção do dashboard com `<RequirePermission>`
- Usar fallback apropriado (null ou mensagem)
- Testar com diferentes níveis de permissão

---

**Última Atualização**: Baseado em análise do `GUIA_TESTES_INTEGRACAO.md`
