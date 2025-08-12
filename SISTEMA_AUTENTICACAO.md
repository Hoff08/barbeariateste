# Sistema de Autenticação por Gmail - BC Ducorte

## Visão Geral

O sistema implementa autenticação baseada em Gmail com diferentes níveis de acesso para diferentes tipos de usuários.

## Usuários Autorizados

### 1. Dono (Acesso Total)
- **Gmail**: `dono@barbearia.com`
- **Senha**: `123456`
- **Acesso**: Todos os painéis
  - Dashboard
  - Admin Panel (Gestão de Profissionais)
  - Clients Panel (Gestão de Clientes)
  - Owner Panel (Visão Geral)
  - Barber Panel (Painel do Barbeiro)

### 2. Funcionários (Acesso Limitado)
- **Gmails**:
  - `funcionario1@barbearia.com`
  - `funcionario2@barbearia.com`
  - `cristofer@barbearia.com`
  - `diego@barbearia.com`
  - `joao@barbearia.com`
- **Senha**: `123456`
- **Acesso**: Apenas Barber Panel

## Como Usar

### 1. Acessar o Sistema
1. Abra o arquivo `dashboard.html` no navegador
2. O sistema mostrará automaticamente um modal de login
3. Digite um dos Gmails autorizados e a senha `123456`

### 2. Navegação por Tipo de Usuário

#### Para o Dono:
- Após o login, verá todas as opções no menu lateral:
  - **Gestão de Profissionais**: Acesso ao admin-panel.html
  - **Gestão de Clientes**: Acesso ao clients-panel.html
  - **Visão Geral**: Acesso ao owner-panel.html
  - **Painel do Barbeiro**: Acesso ao barber-panel.html

#### Para Funcionários:
- Após o login, verá apenas:
  - **Painel do Barbeiro**: Acesso ao barber-panel.html

### 3. Proteção de Acesso
- Cada painel verifica automaticamente se o usuário tem permissão
- Tentativas de acesso direto a painéis sem permissão são redirecionadas para o dashboard
- Usuários não autorizados recebem alerta de "Acesso Negado"

## Funcionalidades por Painel

### Dashboard (dashboard.html)
- **Público**: Todos os usuários logados
- **Função**: Hub central de navegação
- **Recursos**: 
  - Login/Logout
  - Menu dinâmico baseado no tipo de usuário
  - Toggle de tema claro/escuro

### Admin Panel (admin-panel.html)
- **Acesso**: Apenas Dono
- **Função**: Gestão de profissionais
- **Recursos**:
  - Adicionar/Editar/Excluir profissionais
  - Visualizar estatísticas
  - Buscar profissionais

### Clients Panel (clients-panel.html)
- **Acesso**: Apenas Dono
- **Função**: Gestão de clientes
- **Recursos**:
  - Adicionar/Editar/Excluir clientes
  - Visualizar estatísticas
  - Buscar clientes

### Owner Panel (owner-panel.html)
- **Acesso**: Apenas Dono
- **Função**: Visão geral do negócio
- **Recursos**:
  - Gráficos de receita
  - Estatísticas de agendamentos
  - Análise de filiais

### Barber Panel (barber-panel.html)
- **Acesso**: Dono e Funcionários
- **Função**: Gestão de agendamentos
- **Recursos**:
  - Calendário de agendamentos
  - Detalhes dos clientes
  - Gestão de horários

## Segurança

### Autenticação
- Baseada em Gmail + senha
- Dados armazenados no localStorage
- Verificação em cada página

### Autorização
- Verificação de papel (role) em cada painel
- Redirecionamento automático para usuários não autorizados
- Mensagens de erro informativas

### Logout
- Limpa todos os dados de sessão
- Redireciona para o dashboard
- Força novo login

## Personalização

### Adicionar Novos Usuários
Para adicionar novos usuários, edite o objeto `AUTHORIZED_USERS` no arquivo `dashboard.html`:

```javascript
const AUTHORIZED_USERS = {
    'novo@email.com': {
        role: 'employee', // ou 'owner'
        name: 'Nome do Usuário',
        access: ['barber-panel'] // ou array completo para owner
    }
};
```

### Modificar Permissões
- **Owner**: Acesso total a todos os painéis
- **Employee**: Acesso apenas ao barber-panel
- **Client**: Acesso limitado (implementação futura)

## Notas Importantes

1. **Senha Padrão**: Todos os usuários usam a senha `123456` para testes
2. **Produção**: Em produção, implementar autenticação real com servidor
3. **Persistência**: Os dados de login persistem até o logout ou limpeza do navegador
4. **Navegação**: Sempre acesse o sistema através do `dashboard.html`

## Troubleshooting

### Problema: "Acesso Negado"
- Verifique se está usando um Gmail autorizado
- Confirme se a senha está correta (123456)
- Limpe o localStorage e tente novamente

### Problema: Menu não aparece
- Verifique se o login foi bem-sucedido
- Recarregue a página
- Verifique o console do navegador para erros

### Problema: Redirecionamento infinito
- Limpe o localStorage: `localStorage.clear()`
- Recarregue a página
- Faça login novamente
