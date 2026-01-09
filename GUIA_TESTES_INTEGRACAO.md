# Guia de Testes de Integração - Painéis Admin, Empresa e Motorista

## 🎯 Objetivo
Validar todas as funcionalidades dos três painéis e garantir que a comunicação entre módulos funciona corretamente.

---

## 📋 Pré-requisitos

### Contas de Teste Necessárias
1. **Admin** - Conta com todas as permissões
2. **Empresa** - Conta aprovada e ativa
3. **Empresa Pendente** - Conta aguardando aprovação
4. **Motorista** - Conta aprovada e ativa
5. **Motorista Pendente** - Conta aguardando aprovação

### Ambiente
- ✅ Servidor de desenvolvimento rodando
- ✅ Banco de dados com dados de teste
- ✅ Logs habilitados para debug

---

## 🔴 TESTE 1: Painel Admin

### 1.1 Dashboard Principal

**Passos**:
1. Fazer login como Admin
2. Acessar `/admin/dashboard`
3. Verificar se todas as estatísticas carregam
4. Verificar se gráficos são exibidos
5. Verificar se listas de pendências aparecem

**Critérios de Sucesso**:
- [ ] Estatísticas carregam sem erros
- [ ] Gráficos são renderizados corretamente
- [ ] Listas de empresas/motoristas/campanhas pendentes aparecem
- [ ] Notificações são exibidas
- [ ] Feed de atividades funciona

**Problemas Conhecidos**:
- ⚠️ Admin Dashboard não usa `RequirePermission` (apenas `ProtectedRoute`)
- ⚠️ Múltiplas chamadas de hooks podem afetar performance

### 1.2 Gestão de Empresas

**Passos**:
1. Acessar `/admin/empresas`
2. Verificar lista de empresas
3. Clicar em "Aprovar" para empresa pendente
4. Verificar se empresa é aprovada
5. Verificar se notificação é enviada
6. Verificar detalhes da empresa em `/admin/empresas/[id]`
7. Testar bloqueio/suspensão de empresa ativa

**Critérios de Sucesso**:
- [ ] Lista de empresas carrega
- [ ] Aprovação funciona e atualiza status
- [ ] Notificação é enviada para empresa
- [ ] Detalhes da empresa são exibidos corretamente
- [ ] Bloqueio/suspensão funcionam
- [ ] Permissões são verificadas (`RequirePermission`)

**Permissões Necessárias**:
- `empresas.read` - Para visualizar
- `empresas.approve` - Para aprovar
- `empresas.block` - Para bloquear/suspender

### 1.3 Gestão de Motoristas

**Passos**:
1. Acessar `/admin/motoristas`
2. Verificar lista de motoristas
3. Clicar em "Aprovar" para motorista pendente
4. Verificar se motorista é aprovado
5. Verificar se notificação é enviada
6. Verificar detalhes do motorista em `/admin/motoristas/[id]`
7. Testar bloqueio/suspensão de motorista aprovado

**Critérios de Sucesso**:
- [ ] Lista de motoristas carrega
- [ ] Aprovação funciona e atualiza status
- [ ] Notificação é enviada para motorista
- [ ] Detalhes do motorista são exibidos corretamente
- [ ] Bloqueio/suspensão funcionam
- [ ] Permissões são verificadas

**Permissões Necessárias**:
- `motoristas.read` - Para visualizar
- `motoristas.approve` - Para aprovar
- `motoristas.block` - Para bloquear/suspender

### 1.4 Gestão de Campanhas

**Passos**:
1. Acessar `/admin/campanhas`
2. Verificar lista de campanhas
3. Verificar campanhas pendentes
4. Aprovar campanha pendente
5. Verificar detalhes da campanha em `/admin/campanhas/[id]`
6. Testar rejeição de campanha

**Critérios de Sucesso**:
- [ ] Lista de campanhas carrega
- [ ] Filtros funcionam
- [ ] Aprovação/rejeição funcionam
- [ ] Notificação é enviada para empresa
- [ ] Detalhes da campanha são exibidos corretamente
- [ ] Permissões são verificadas

**Permissões Necessárias**:
- `campanhas.read` - Para visualizar
- `campanhas.approve` - Para aprovar/rejeitar

### 1.5 Gestão de Pagamentos

**Passos**:
1. Acessar `/admin/pagamentos`
2. Verificar resumo financeiro
3. Verificar lista de pagamentos
4. Verificar filtros e abas
5. Verificar gráficos financeiros

**Critérios de Sucesso**:
- [ ] Resumo financeiro carrega
- [ ] Lista de pagamentos funciona
- [ ] Filtros funcionam
- [ ] Gráficos são exibidos
- [ ] Permissões são verificadas

**Permissões Necessárias**:
- `pagamentos.read` - Para visualizar

### 1.6 Gestão de Suporte

**Passos**:
1. Acessar `/admin/suporte`
2. Verificar lista de tickets
3. Abrir ticket específico em `/admin/suporte/[id]`
4. Responder ticket
5. Fechar ticket
6. Verificar se notificação é enviada

**Critérios de Sucesso**:
- [ ] Lista de tickets carrega
- [ ] Detalhes do ticket são exibidos
- [ ] Resposta funciona
- [ ] Fechamento funciona
- [ ] Notificação é enviada
- [ ] Permissões são verificadas

**Permissões Necessárias**:
- `suporte.read` - Para visualizar
- `suporte.respond` - Para responder

### 1.7 Gestão de Roles e Permissões

**Passos**:
1. Acessar `/admin/roles`
2. Verificar lista de usuários
3. Verificar roles disponíveis
4. Atribuir role a usuário
5. Verificar se permissões são atualizadas

**Critérios de Sucesso**:
- [ ] Lista de usuários carrega
- [ ] Roles são exibidos corretamente
- [ ] Atribuição de role funciona
- [ ] Permissões são atualizadas
- [ ] Permissões são verificadas

**Permissões Necessárias**:
- `users.manage_roles` - Para gerenciar roles

### 1.8 Logs e Relatórios

**Passos**:
1. Acessar `/admin/logs`
2. Verificar logs do sistema
3. Acessar `/admin/relatorios`
4. Gerar relatório
5. Verificar se relatório é gerado corretamente

**Critérios de Sucesso**:
- [ ] Logs são exibidos
- [ ] Filtros funcionam
- [ ] Relatórios são gerados
- [ ] Exportação funciona (se disponível)
- [ ] Permissões são verificadas

**Permissões Necessárias**:
- `users.read` - Para visualizar logs
- `configuracoes.read` - Para relatórios

---

## 🏢 TESTE 2: Painel Empresa

### 2.1 Dashboard Principal

**Passos**:
1. Fazer login como Empresa
2. Acessar `/empresa/dashboard`
3. Verificar estatísticas
4. Verificar gráficos de performance
5. Verificar mapa de campanhas
6. Verificar lista de campanhas ativas/pendentes

**Critérios de Sucesso**:
- [ ] Estatísticas carregam
- [ ] Gráficos são exibidos
- [ ] Mapa carrega (lazy loading funciona)
- [ ] Campanhas são listadas corretamente
- [ ] Métricas são atualizadas
- [ ] Status badge é exibido

**Problemas Conhecidos**:
- ✅ Lazy loading do mapa implementado corretamente
- ✅ Filtragem no frontend funciona

### 2.2 Gestão de Campanhas

**Passos**:
1. Acessar `/empresa/campanhas`
2. Verificar lista de campanhas
3. Criar nova campanha em `/empresa/campanhas/nova`
4. Preencher formulário
5. Salvar como rascunho
6. Enviar para aprovação
7. Verificar detalhes da campanha em `/empresa/campanhas/[id]`

**Critérios de Sucesso**:
- [ ] Lista de campanhas carrega
- [ ] Criação de campanha funciona
- [ ] Rascunho é salvo
- [ ] Envio para aprovação funciona
- [ ] Detalhes da campanha são exibidos
- [ ] Métricas são atualizadas

### 2.3 Gestão de Mídias

**Passos**:
1. Acessar `/empresa/midias`
2. Verificar lista de mídias
3. Fazer upload de nova mídia
4. Verificar se upload funciona
5. Verificar se mídia aparece na lista

**Critérios de Sucesso**:
- [ ] Lista de mídias carrega
- [ ] Upload funciona
- [ ] Validação de arquivo funciona
- [ ] Mídia é exibida corretamente

### 2.4 Pagamentos

**Passos**:
1. Acessar `/empresa/pagamentos`
2. Verificar histórico de pagamentos
3. Verificar métodos de pagamento
4. Adicionar método de pagamento (se disponível)

**Critérios de Sucesso**:
- [ ] Histórico carrega
- [ ] Métodos são exibidos
- [ ] Adição de método funciona (se disponível)

### 2.5 Perfil

**Passos**:
1. Acessar `/empresa/perfil`
2. Verificar dados da empresa
3. Editar informações
4. Salvar alterações
5. Verificar se dados são atualizados

**Critérios de Sucesso**:
- [ ] Dados são exibidos corretamente
- [ ] Edição funciona
- [ ] Validação funciona
- [ ] Salvamento funciona
- [ ] Dados são atualizados

### 2.6 Suporte

**Passos**:
1. Acessar `/empresa/suporte`
2. Verificar histórico de tickets
3. Abrir novo ticket
4. Preencher formulário
5. Enviar ticket
6. Verificar se ticket aparece na lista

**Critérios de Sucesso**:
- [ ] Histórico carrega
- [ ] Criação de ticket funciona
- [ ] Formulário valida corretamente
- [ ] Ticket é criado
- [ ] Notificação é enviada para admin

---

## 🚗 TESTE 3: Painel Motorista

### 3.1 Dashboard Principal

**Passos**:
1. Fazer login como Motorista
2. Acessar `/motorista/dashboard`
3. Verificar estatísticas de ganhos
4. Verificar status do motorista
5. Verificar status do tablet
6. Verificar links para outras páginas

**Critérios de Sucesso**:
- [ ] Estatísticas de ganhos carregam
- [ ] Status badge é exibido corretamente
- [ ] Status do tablet é exibido
- [ ] Links funcionam
- [ ] Alertas são exibidos quando necessário

**Problemas Conhecidos**:
- ⚠️ Sistema de viagens não implementado (TODO na linha 63)
- ✅ Instrumentação de debug presente (deve ser removida após testes)

### 3.2 Ganhos

**Passos**:
1. Acessar `/motorista/ganhos`
2. Verificar histórico de ganhos
3. Verificar filtros (dia, semana, mês)
4. Verificar gráficos (se disponíveis)
5. Verificar detalhes de pagamentos

**Critérios de Sucesso**:
- [ ] Histórico carrega
- [ ] Filtros funcionam
- [ ] Gráficos são exibidos (se disponíveis)
- [ ] Detalhes são exibidos corretamente

### 3.3 Tablet

**Passos**:
1. Acessar `/motorista/tablet`
2. Verificar status do tablet
3. Vincular tablet (se não vinculado)
4. Verificar se vinculação funciona
5. Desvincular tablet (se necessário)

**Critérios de Sucesso**:
- [ ] Status é exibido
- [ ] Vinculação funciona
- [ ] Desvinculação funciona
- [ ] Status é atualizado

### 3.4 Perfil

**Passos**:
1. Acessar `/motorista/perfil`
2. Verificar dados do motorista
3. Editar informações
4. Salvar alterações
5. Verificar se dados são atualizados

**Critérios de Sucesso**:
- [ ] Dados são exibidos corretamente
- [ ] Edição funciona
- [ ] Validação funciona
- [ ] Salvamento funciona
- [ ] Dados são atualizados

### 3.5 Suporte

**Passos**:
1. Acessar `/motorista/suporte`
2. Verificar histórico de tickets
3. Abrir novo ticket
4. Preencher formulário
5. Enviar ticket
6. Verificar se ticket aparece na lista

**Critérios de Sucesso**:
- [ ] Histórico carrega
- [ ] Criação de ticket funciona
- [ ] Formulário valida corretamente
- [ ] Ticket é criado
- [ ] Notificação é enviada para admin

---

## 🔗 TESTE 4: Integração entre Módulos

### 4.1 Fluxo de Aprovação Completo

**Cenário**: Empresa cria campanha → Admin aprova → Motorista visualiza

**Passos**:
1. Login como Empresa
2. Criar nova campanha
3. Enviar para aprovação
4. Logout
5. Login como Admin
6. Verificar campanha pendente no dashboard
7. Aprovar campanha
8. Verificar se notificação é enviada para empresa
9. Logout
10. Login como Empresa
11. Verificar se campanha aparece como aprovada
12. Logout
13. Login como Motorista
14. Verificar se campanha aparece na lista de campanhas disponíveis

**Critérios de Sucesso**:
- [ ] Campanha é criada
- [ ] Admin vê campanha pendente
- [ ] Aprovação funciona
- [ ] Notificação é enviada
- [ ] Empresa vê campanha aprovada
- [ ] Motorista vê campanha disponível

### 4.2 Fluxo de Pagamento

**Cenário**: Empresa faz pagamento → Motorista recebe → Admin visualiza

**Passos**:
1. Login como Empresa
2. Fazer pagamento (se funcionalidade disponível)
3. Verificar histórico de pagamentos
4. Logout
5. Login como Motorista
6. Verificar se ganhos são atualizados
7. Verificar histórico de ganhos
8. Logout
9. Login como Admin
10. Verificar se pagamento aparece no dashboard financeiro
11. Verificar relatórios financeiros

**Critérios de Sucesso**:
- [ ] Pagamento é processado
- [ ] Motorista recebe atualização
- [ ] Admin vê no dashboard
- [ ] Relatórios são atualizados

### 4.3 Fluxo de Suporte

**Cenário**: Usuário abre ticket → Admin responde → Usuário recebe notificação

**Passos**:
1. Login como Empresa ou Motorista
2. Abrir ticket de suporte
3. Preencher formulário
4. Enviar ticket
5. Verificar se ticket aparece na lista
6. Logout
7. Login como Admin
8. Verificar se ticket aparece na lista de tickets abertos
9. Abrir ticket
10. Responder ticket
11. Verificar se notificação é enviada
12. Logout
13. Login como usuário original
14. Verificar se resposta aparece no ticket
15. Verificar se notificação foi recebida

**Critérios de Sucesso**:
- [ ] Ticket é criado
- [ ] Admin vê ticket
- [ ] Resposta funciona
- [ ] Notificação é enviada
- [ ] Usuário vê resposta

### 4.4 Fluxo de Aprovação de Usuário

**Cenário**: Novo usuário se cadastra → Admin aprova → Usuário recebe notificação

**Passos**:
1. Cadastrar nova Empresa
2. Verificar se aparece como pendente
3. Login como Admin
4. Verificar empresa pendente no dashboard
5. Aprovar empresa
6. Verificar se notificação é enviada
7. Logout
8. Login como Empresa recém-aprovada
9. Verificar se status mudou para "ativa"
10. Verificar se notificação foi recebida
11. Repetir para Motorista

**Critérios de Sucesso**:
- [ ] Cadastro funciona
- [ ] Admin vê pendente
- [ ] Aprovação funciona
- [ ] Notificação é enviada
- [ ] Status é atualizado
- [ ] Usuário pode fazer login

---

## ⚠️ TESTE 5: Casos de Erro

### 5.1 Erros de Autenticação

**Testes**:
- [ ] Sessão expirada durante uso
- [ ] Token inválido
- [ ] Perfil não encontrado
- [ ] Email não confirmado

**Critérios de Sucesso**:
- [ ] Redirecionamento para login funciona
- [ ] Mensagens de erro são exibidas
- [ ] Dados não são perdidos

### 5.2 Erros de Permissão

**Testes**:
- [ ] Empresa tenta acessar `/admin/dashboard`
- [ ] Motorista tenta acessar `/empresa/dashboard`
- [ ] Usuário sem permissão tenta ação restrita

**Critérios de Sucesso**:
- [ ] Redirecionamento funciona
- [ ] Ações restritas não aparecem
- [ ] Mensagens apropriadas são exibidas

### 5.3 Erros de Dados

**Testes**:
- [ ] Dados não encontrados (404)
- [ ] Erro de validação
- [ ] Erro de servidor (500)
- [ ] Timeout de requisição

**Critérios de Sucesso**:
- [ ] Mensagens de erro são exibidas
- [ ] Sistema não quebra
- [ ] Usuário pode tentar novamente

### 5.4 Erros de Estado

**Testes**:
- [ ] Empresa bloqueada tenta fazer login
- [ ] Motorista suspenso tenta acessar dashboard
- [ ] Campanha expirada ainda aparece como ativa

**Critérios de Sucesso**:
- [ ] Login é bloqueado quando apropriado
- [ ] Mensagens explicativas são exibidas
- [ ] Status é verificado corretamente

---

## 📊 Checklist Final

### Funcionalidades Críticas
- [ ] Login funciona para todos os tipos de usuário
- [ ] Redirecionamento após login funciona
- [ ] Navegação entre páginas funciona
- [ ] Logout funciona
- [ ] Permissões são respeitadas

### Admin
- [ ] Dashboard carrega todas as estatísticas
- [ ] Aprovação de empresas funciona
- [ ] Aprovação de motoristas funciona
- [ ] Aprovação de campanhas funciona
- [ ] Gestão de tickets funciona
- [ ] Relatórios são gerados

### Empresa
- [ ] Dashboard carrega estatísticas
- [ ] Criação de campanhas funciona
- [ ] Upload de mídias funciona
- [ ] Visualização de métricas funciona
- [ ] Pagamentos são exibidos

### Motorista
- [ ] Dashboard carrega ganhos
- [ ] Visualização de campanhas funciona
- [ ] Vinculação de tablet funciona
- [ ] Histórico de ganhos funciona

### Integração
- [ ] Notificações são enviadas corretamente
- [ ] Dados são sincronizados entre módulos
- [ ] Fluxos críticos funcionam end-to-end

---

## 🐛 Problemas Identificados Durante Testes

### Críticos 🔴
_(Preencher durante testes)_

### Médios 🟡
_(Preencher durante testes)_

### Baixos 🟢
_(Preencher durante testes)_

---

## 📝 Notas de Teste

**Data**: _______________
**Testador**: _______________
**Ambiente**: _______________
**Versão**: _______________

**Observações**:
_(Preencher durante testes)_

---

**Status**: ⏳ Aguardando Execução dos Testes
