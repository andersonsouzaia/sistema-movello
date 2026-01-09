# Guia de Teste Completo - Login de Usuários

## Data: 2024
## Objetivo: Testar login para todos os tipos de usuários (Empresas, Motoristas, Superadmins)

---

## 🧪 CENÁRIOS DE TESTE

### 1. **TESTE DE LOGIN - MOTORISTA**

#### 1.1 Motorista com Email Confirmado e Status Aprovado
- **Dados de teste:**
  - Email: [usar email de motorista real]
  - Senha: [senha válida]
  - Status esperado: `aprovado`
  - Email confirmado: `true`

- **Resultado esperado:**
  - Login bem-sucedido
  - Redirecionamento para `/motorista/dashboard`
  - Dados do motorista carregados corretamente
  - Status exibido como "Aprovado"

#### 1.2 Motorista com Email Não Confirmado
- **Dados de teste:**
  - Email: [usar email de motorista não confirmado]
  - Senha: [senha válida]

- **Resultado esperado:**
  - Login bem-sucedido no Supabase
  - Redirecionamento para `/confirmar-email`
  - Mensagem clara sobre necessidade de confirmar email

#### 1.3 Motorista Bloqueado
- **Dados de teste:**
  - Email: [usar email de motorista bloqueado]
  - Senha: [senha válida]

- **Resultado esperado:**
  - Login falha com mensagem: "Sua conta está bloqueada. Entre em contato com o suporte."
  - Não redireciona para dashboard
  - Erro exibido claramente

#### 1.4 Motorista Suspenso
- **Dados de teste:**
  - Email: [usar email de motorista suspenso]
  - Senha: [senha válida]

- **Resultado esperado:**
  - Login falha com mensagem: "Sua conta está suspensa. Entre em contato com o suporte."
  - Não redireciona para dashboard
  - Erro exibido claramente

#### 1.5 Motorista Aguardando Aprovação
- **Dados de teste:**
  - Email: [usar email de motorista com status `aguardando_aprovacao`]
  - Senha: [senha válida]

- **Resultado esperado:**
  - Login bem-sucedido
  - Redirecionamento para `/motorista/dashboard`
  - Mensagem sobre aguardando aprovação exibida
  - Acesso limitado conforme necessário

---

### 2. **TESTE DE LOGIN - EMPRESA**

#### 2.1 Empresa com Email Confirmado e Status Aprovado
- **Dados de teste:**
  - Email: [usar email de empresa real]
  - Senha: [senha válida]
  - Status esperado: `aprovado`
  - Email confirmado: `true`

- **Resultado esperado:**
  - Login bem-sucedido
  - Redirecionamento para `/empresa/dashboard`
  - Dados da empresa carregados corretamente

#### 2.2 Empresa com Email Não Confirmado
- **Dados de teste:**
  - Email: [usar email de empresa não confirmado]
  - Senha: [senha válida]

- **Resultado esperado:**
  - Login bem-sucedido no Supabase
  - Redirecionamento para `/confirmar-email`
  - Mensagem clara sobre necessidade de confirmar email

#### 2.3 Empresa Bloqueada
- **Dados de teste:**
  - Email: [usar email de empresa bloqueada]
  - Senha: [senha válida]

- **Resultado esperado:**
  - Login falha com mensagem: "Sua conta está bloqueada. Entre em contato com o suporte."
  - Não redireciona para dashboard

#### 2.4 Empresa Aguardando Aprovação
- **Dados de teste:**
  - Email: [usar email de empresa com status `aguardando_aprovacao`]
  - Senha: [senha válida]

- **Resultado esperado:**
  - Login bem-sucedido
  - Redirecionamento para `/empresa/dashboard`
  - Mensagem sobre aguardando aprovação exibida

---

### 3. **TESTE DE LOGIN - SUPERADMIN**

#### 3.1 Superadmin com Email Confirmado
- **Dados de teste:**
  - Email: [usar email de superadmin]
  - Senha: [senha válida]
  - Email confirmado: `true`

- **Resultado esperado:**
  - Login bem-sucedido
  - Redirecionamento para `/admin/dashboard`
  - Dados do admin carregados corretamente
  - Acesso completo ao sistema

#### 3.2 Superadmin com Email Não Confirmado
- **Dados de teste:**
  - Email: [usar email de admin não confirmado]
  - Senha: [senha válida]

- **Resultado esperado:**
  - Login bem-sucedido no Supabase
  - Redirecionamento para `/confirmar-email`
  - Mensagem clara sobre necessidade de confirmar email

---

### 4. **TESTE DE ERROS COMUNS**

#### 4.1 Credenciais Inválidas
- **Dados de teste:**
  - Email: [email válido]
  - Senha: [senha incorreta]

- **Resultado esperado:**
  - Login falha
  - Mensagem: "Email ou senha incorretos. Verifique suas credenciais."
  - Tentativa registrada no sistema de bloqueio

#### 4.2 Email Não Cadastrado
- **Dados de teste:**
  - Email: [email que não existe no sistema]
  - Senha: [qualquer senha]

- **Resultado esperado:**
  - Login falha
  - Mensagem: "Email ou senha incorretos. Verifique suas credenciais."
  - Não expor que o email não existe (segurança)

#### 4.3 Conta Bloqueada por Tentativas
- **Dados de teste:**
  - Email: [email com múltiplas tentativas falhadas]
  - Senha: [senha incorreta várias vezes]

- **Resultado esperado:**
  - Após 3 tentativas, conta bloqueada temporariamente
  - Mensagem com tempo restante de bloqueio
  - Timer contando regressivamente

#### 4.4 Perfil Não Encontrado no Banco
- **Cenário:**
  - Usuário existe no Supabase Auth mas não tem registro em `users` ou tabela específica

- **Resultado esperado:**
  - Login falha após tentar carregar perfil
  - Mensagem: "Erro ao carregar perfil. Tente novamente ou entre em contato com o suporte."
  - Logs detalhados para debug

#### 4.5 Timeout no Carregamento de Perfil
- **Cenário:**
  - Login bem-sucedido mas `userType` não carrega em 10 segundos

- **Resultado esperado:**
  - Após 10 segundos, mensagem de erro exibida
  - Opção de tentar login novamente
  - Logs para rastrear o problema

---

## 📝 CHECKLIST DE TESTES

### Testes Básicos
- [ ] Login com motorista aprovado
- [ ] Login com empresa aprovada
- [ ] Login com superadmin
- [ ] Login com credenciais inválidas
- [ ] Login com email não cadastrado

### Testes de Status
- [ ] Login com motorista bloqueado
- [ ] Login com motorista suspenso
- [ ] Login com motorista aguardando aprovação
- [ ] Login com empresa bloqueada
- [ ] Login com empresa aguardando aprovação

### Testes de Email
- [ ] Login com email não confirmado (motorista)
- [ ] Login com email não confirmado (empresa)
- [ ] Login com email não confirmado (admin)
- [ ] Redirecionamento para confirmação de email

### Testes de Erros
- [ ] Conta bloqueada por tentativas
- [ ] Perfil não encontrado no banco
- [ ] Timeout no carregamento de perfil
- [ ] Erro de conexão durante login
- [ ] Erro de permissão (RLS)

### Testes de Redirecionamento
- [ ] Redirecionamento correto para motorista
- [ ] Redirecionamento correto para empresa
- [ ] Redirecionamento correto para admin
- [ ] Redirecionamento para página anterior após login
- [ ] Redirecionamento para confirmação de email

### Testes de Performance
- [ ] Login rápido (< 2 segundos)
- [ ] Carregamento de perfil rápido
- [ ] Sem múltiplas chamadas desnecessárias
- [ ] Sem race conditions

---

## 🔍 OBSERVAÇÕES DURANTE OS TESTES

### Pontos a Observar:
1. **Tempo de resposta:** Login deve ser rápido (< 2 segundos)
2. **Mensagens de erro:** Devem ser claras e específicas
3. **Redirecionamentos:** Devem acontecer corretamente
4. **Estados de loading:** Devem ser exibidos adequadamente
5. **Logs no console:** Verificar se há erros ou warnings
6. **Dados carregados:** Verificar se todos os dados estão corretos
7. **Status exibido:** Verificar se status está correto no dashboard

### Problemas a Reportar:
- Login demora muito (> 5 segundos)
- Mensagens de erro confusas ou genéricas
- Redirecionamento para página errada
- Dados não carregados corretamente
- Erros no console do navegador
- Estados inconsistentes
- Múltiplos redirecionamentos

---

## 📊 RESULTADOS ESPERADOS

### Sucesso:
- ✅ Login bem-sucedido em < 2 segundos
- ✅ Redirecionamento correto baseado em `userType`
- ✅ Dados do perfil carregados corretamente
- ✅ Status do usuário verificado e exibido
- ✅ Sem erros no console
- ✅ Experiência fluida e clara

### Falhas Esperadas (com tratamento adequado):
- ❌ Credenciais inválidas → Mensagem clara
- ❌ Conta bloqueada → Mensagem com tempo restante
- ❌ Email não confirmado → Redirecionamento para confirmação
- ❌ Perfil não encontrado → Mensagem de erro específica
- ❌ Timeout → Mensagem e opção de tentar novamente

---

**Última atualização:** 2024
