# 📊 TABELAS DE PLANOS - SUPABASE CINECASA

## 🚀 **INSTRUÇÕES DE INSTALAÇÃO**

### **1. Como Executar o Script**

1. **Acesse o Supabase Dashboard**
   - Vá para https://supabase.com/dashboard
   - Faça login com sua conta
   - Selecione seu projeto CineCasa

2. **Abra o SQL Editor**
   - No menu lateral, clique em **"SQL Editor"**
   - Clique em **"New query"**

3. **Copie e Cole o Script**
   - Abra o arquivo `tabelas_planos_supabase.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em **"Run"** ou **Ctrl+Enter**

---

## 📋 **TABELAS CRIADAS**

### **🔹 `planos`**
- **Função:** Planos de assinatura disponíveis
- **Campos principais:**
  - `nome`: Nome do plano
  - `descricao`: Descrição detalhada
  - `preco`: Valor mensal/trimestral/anual
  - `duracao_meses`: Duração em meses
  - `recursos`: JSON com recursos disponíveis
  - `popular`: Se é plano popular
  - `ativo`: Se está disponível

### **🔹 `preco_historico`**
- **Função:** Histórico de alterações de preços
- **Campos principais:**
  - `plano_id`: Referência ao plano
  - `preco_antigo`: Valor anterior
  - `preco_novo`: Novo valor
  - `data_alteracao`: Quando foi alterado

### **🔹 `usuario_plano`**
- **Função:** Relacionamento usuário × plano
- **Campos principais:**
  - `user_id`: ID do usuário
  - `plano_id`: ID do plano contratado
  - `status`: ativo/cancelado/expirado/pendente
  - `data_inicio`: Início do contrato
  - `data_fim`: Fim do contrato
  - `valor_pago`: Valor pago

### **🔹 `config_pagamento`**
- **Função:** Configurações gerais do sistema
- **Campos principais:**
  - `chave`: Nome da configuração
  - `valor`: Valor da configuração
  - `tipo`: pix_key/payment_method/email_notification

---

## 🎯 **COMO GERENCIAR PLANOS**

### **✅ Adicionar Novo Plano**
```sql
INSERT INTO planos (nome, descricao, preco, duracao_meses, recursos, popular, ativo) VALUES
(
    'Plano Premium',
    'Acesso completo com todos os recursos',
    99.90,
    1,
    '{
        "streaming_ilimitado": true,
        "qualidade_hd": true,
        "qualidade_4k": true,
        "dispositivos_simultaneos": 10,
        "downloads_offline": true,
        "conteudo_exclusivo": true,
        "suporte_prioritario": true
    }',
    false,
    true
);
```

### **✅ Alterar Preço de Plano**
```sql
UPDATE planos 
SET preco = 29.90 
WHERE nome = 'Plano Mensal';
-- O histórico é salvo automaticamente!
```

### **✅ Desativar Plano**
```sql
UPDATE planos 
SET ativo = false 
WHERE nome = 'Plano Antigo';
```

### **✅ Atualizar Recursos**
```sql
UPDATE planos 
SET recursos = '{
    "streaming_ilimitado": true,
    "qualidade_hd": true,
    "qualidade_4k": true,
    "dispositivos_simultaneos": 3,
    "downloads_offline": true,
    "conteudo_exclusivo": true,
    "suporte_prioritario": false
}'
WHERE nome = 'Plano Trimestral';
```

---

## 💳 **CONFIGURAÇÕES DE PAGAMENTO**

### **✅ Alterar Chave PIX**
```sql
UPDATE config_pagamento 
SET valor = 'NOVA_CHAVE_PIX_AQUI' 
WHERE chave = 'pix_key';
```

### **✅ Configurar Métodos de Pagamento**
```sql
UPDATE config_pagamento 
SET valor = '["pix", "credit_card", "paypal", "debit_card"]' 
WHERE chave = 'payment_methods';
```

### **✅ Ativar/Desativar Notificações**
```sql
UPDATE config_pagamento 
SET valor = 'false' 
WHERE chave = 'email_notifications';
```

---

## 📊 **CONSULTAS ÚTEIS**

### **✅ Ver Todos os Planos Ativos**
```sql
SELECT * FROM planos_ativos ORDER BY popular DESC, preco ASC;
```

### **✅ Estatísticas de Planos**
```sql
SELECT 
    p.nome,
    COUNT(up.id) as total_contratados,
    SUM(up.valor_pago) as total_receita
FROM planos p
LEFT JOIN usuario_plano up ON p.id = up.plano_id AND up.status = 'ativo'
GROUP BY p.id, p.nome
ORDER BY total_contratados DESC;
```

### **✅ Histórico de Preços**
```sql
SELECT 
    p.nome,
    ph.preco_antigo,
    ph.preco_novo,
    ph.data_alteracao
FROM preco_historico ph
JOIN planos p ON ph.plano_id = p.id
ORDER BY ph.data_alteracao DESC;
```

### **✅ Planos Expirando**
```sql
SELECT 
    up.user_id,
    p.nome as plano_nome,
    up.data_fim,
    up.data_fim - CURRENT_DATE as dias_restantes
FROM usuario_plano up
JOIN planos p ON up.plano_id = p.id
WHERE up.status = 'ativo'
AND up.data_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY up.data_fim ASC;
```

---

## 🔧 **RECURSOS JSON EXPLICADOS**

### **Estrutura do Campo `recursos`:**
```json
{
    "streaming_ilimitado": true,      // Streaming sem limites
    "qualidade_hd": true,              // Qualidade HD disponível
    "qualidade_4k": true,              // Qualidade 4K disponível
    "dispositivos_simultaneos": 2,     // Número de dispositivos simultâneos
    "downloads_offline": true,         // Downloads para assistir offline
    "conteudo_exclusivo": true,        // Acesso a conteúdo exclusivo
    "suporte_prioritario": false,      // Suporte prioritário
    "perfis_infantis": true,           // Perfis infantis (plano família)
    "controle_parental": true          // Controle parental
}
```

---

## 🛡️ **SEGURANÇA**

### **✅ Políticas de Acesso:**
- **Usuários comuns:** Podem ver apenas planos ativos
- **Administradores:** Podem gerenciar todos os planos
- **Usuários:** Veem apenas seus próprios contratos

### **✅ Email Admin:**
- Configure o email admin em: `admin@cinecasa.com`
- Apenas este email terá acesso total às tabelas

---

## 🔄 **AUTOMAÇÕES**

### **✅ Triggers Automáticos:**
1. **Timestamps:** `updated_at` atualizado automaticamente
2. **Histórico:** Preços alterados salvos no histórico
3. **Validações:** Status e datas validadas automaticamente

### **✅ Funções Úteis:**
- `plano_ativo(user_id)`: Verifica se usuário tem plano ativo
- `calcular_data_fim()`: Calcula data de fim baseada na duração

---

## 📱 **INTEGRAÇÃO COM APLICAÇÃO**

### **✅ Como Usar no Frontend:**
```javascript
// Buscar planos ativos
const { data: planos } = await supabase
  .from('planos_ativos')
  .select('*')
  .order('popular', { ascending: false });

// Verificar plano do usuário
const { data: userPlan } = await supabase
  .from('usuarios_planos_ativos')
  .select('*')
  .eq('user_id', userId);
```

---

## 🎯 **DICAS IMPORTANTES**

### **✅ Melhores Práticas:**
1. **Sempre use views** para consultas frequentes
2. **Mantenha o histórico** de preços para análise
3. **Use JSON estruturado** para recursos
4. **Monitore planos expirando** regularmente

### **✅ Manutenção:**
- **Backup:** Exporte dados antes de grandes alterações
- **Teste:** Teste alterações em ambiente de desenvolvimento
- **Log:** Monitore logs de alterações de preços

---

## 🏆 **RESULTADO FINAL**

**✅ Sistema completo de gerenciamento de planos:**
- Tabelas otimizadas e seguras
- Histórico completo de alterações
- Views facilitadas para consultas
- Automações e triggers úteis
- Integração pronta com frontend

**Status:** 🟢 **BANCO DE DADOS 100% PRONTO**  
**Performance:** ⚡ **OTIMIZADO**  
**Segurança:** 🔒 **PROTEGIDO**  
**Manutenção:** 🛠️ **FACILITADA**

**Agora você pode gerenciar todos os planos diretamente pelo Supabase Dashboard!**
