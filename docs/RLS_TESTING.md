# Guia de Testes RLS para Sistema Empresa

Este documento descreve como testar as políticas RLS (Row Level Security) para garantir que as empresas só acessam seus próprios dados.

## Pré-requisitos

1. Ter acesso ao banco de dados PostgreSQL/Supabase
2. Ter pelo menos 2 empresas cadastradas no sistema
3. Ter credenciais de login para ambas as empresas

## Testes Recomendados

### Teste 1: Empresa só vê suas próprias campanhas

**Passos:**
1. Fazer login como Empresa A
2. Criar uma campanha via interface ou SQL
3. Verificar que a campanha aparece na lista
4. Fazer login como Empresa B
5. Verificar que a campanha da Empresa A NÃO aparece na lista
6. Tentar acessar diretamente a campanha da Empresa A via URL (deve retornar erro ou vazio)

**SQL de Verificação:**
```sql
-- Como Empresa A (auth.uid() = empresa_a_id)
SELECT * FROM campanhas; -- Deve retornar apenas campanhas da Empresa A

-- Como Empresa B (auth.uid() = empresa_b_id)
SELECT * FROM campanhas; -- Deve retornar apenas campanhas da Empresa B
```

### Teste 2: Empresa só cria campanhas próprias

**Passos:**
1. Fazer login como Empresa A
2. Criar campanha via função `create_campanha_empresa()`
3. Verificar que `empresa_id` é automaticamente definido como `auth.uid()`
4. Tentar criar campanha com `empresa_id` diferente (deve falhar)

**SQL de Verificação:**
```sql
-- Como Empresa A
SELECT create_campanha_empresa(
  'Título Teste',
  'Descrição Teste',
  1000.00,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days'
);
-- Deve criar campanha com empresa_id = auth.uid()
```

### Teste 3: Empresa só atualiza campanhas não aprovadas

**Passos:**
1. Criar campanha com status 'em_analise'
2. Tentar atualizar (deve funcionar)
3. Admin aprova campanha (status = 'aprovada')
4. Tentar atualizar novamente (deve falhar com erro de permissão)

**SQL de Verificação:**
```sql
-- Como Empresa A, tentar atualizar campanha aprovada
UPDATE campanhas 
SET titulo = 'Novo Título'
WHERE id = 'campanha_aprovada_id' AND empresa_id = auth.uid();
-- Deve falhar devido à política RLS
```

### Teste 4: Empresa só pausa campanhas ativas próprias

**Passos:**
1. Criar e aprovar campanha
2. Ativar campanha (status = 'ativa')
3. Tentar pausar (deve funcionar)
4. Tentar pausar campanha de outra empresa (deve falhar)

**SQL de Verificação:**
```sql
-- Como Empresa A
SELECT toggle_campanha_empresa('campanha_ativa_id', 'pause');
-- Deve funcionar se a campanha pertence à Empresa A

-- Como Empresa B, tentar pausar campanha da Empresa A
SELECT toggle_campanha_empresa('campanha_empresa_a_id', 'pause');
-- Deve falhar
```

### Teste 5: Empresa só vê seus próprios pagamentos

**Passos:**
1. Fazer login como Empresa A
2. Criar um pagamento
3. Verificar que aparece na lista
4. Fazer login como Empresa B
5. Verificar que o pagamento da Empresa A NÃO aparece

**SQL de Verificação:**
```sql
-- Como Empresa A
SELECT * FROM pagamentos; -- Deve retornar apenas pagamentos da Empresa A

-- Como Empresa B
SELECT * FROM pagamentos; -- Deve retornar apenas pagamentos da Empresa B
```

### Teste 6: Empresa só cria tickets próprios

**Passos:**
1. Fazer login como Empresa A
2. Criar ticket
3. Verificar que `empresa_id` é automaticamente definido como `auth.uid()`
4. Tentar criar ticket com `empresa_id` diferente (deve falhar)

**SQL de Verificação:**
```sql
-- Como Empresa A
INSERT INTO tickets (empresa_id, titulo, descricao, status, prioridade, criado_por)
VALUES ('empresa_b_id', 'Teste', 'Descrição', 'aberto', 'media', auth.uid());
-- Deve falhar devido à política RLS
```

## Função de Verificação Automática

Execute a função `verify_empresa_rls()` para verificar automaticamente:

```sql
SELECT * FROM verify_empresa_rls('empresa_id_aqui');
```

## Verificação de Políticas RLS

Para ver todas as políticas RLS criadas:

```sql
-- Ver políticas de campanhas
SELECT * FROM pg_policies WHERE tablename = 'campanhas';

-- Ver políticas de midias
SELECT * FROM pg_policies WHERE tablename = 'midias';

-- Ver políticas de pagamentos
SELECT * FROM pg_policies WHERE tablename = 'pagamentos';

-- Ver políticas de tickets
SELECT * FROM pg_policies WHERE tablename = 'tickets';
```

## Resultados Esperados

Todos os testes devem passar, garantindo que:
- ✅ Empresas só veem seus próprios dados
- ✅ Empresas só criam dados próprios
- ✅ Empresas só atualizam dados próprios quando permitido
- ✅ Empresas não podem acessar dados de outras empresas

## Problemas Comuns

1. **Erro: "permission denied"** - Verificar se a política RLS está correta
2. **Dados aparecem para todas as empresas** - Verificar se `auth.uid()` está sendo usado corretamente
3. **Não consegue criar dados** - Verificar política INSERT
4. **Não consegue atualizar dados** - Verificar política UPDATE e condições de status

