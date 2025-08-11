# 🚀 Início Rápido - Sistema BC Ducorte

## Teste Rápido do Sistema

### 1. Instalação (Windows)
```bash
# Execute o script de instalação
install.bat
```

### 2. Instalação (Linux/Mac)
```bash
# Torne o script executável e execute
chmod +x install.sh
./install.sh
```

### 3. Iniciar o Servidor
```bash
npm run dev
```

### 4. Acessar o Sistema
Abra seu navegador e acesse: `http://localhost:3000`

**Nota**: Se o servidor estiver rodando na porta 3001, acesse: `http://localhost:3001`

## 🎯 Fluxo de Teste

### 1. Landing Page
- Acesse `http://localhost:3000` (ou `http://localhost:3001` se estiver rodando nessa porta)
- Clique em "Agende seu horário" ou no botão flutuante "Agendar"
- Será redirecionado para a página de login

### 2. Cadastro/Login
- **Cadastro**: Preencha nome, email e senha
- **Login Google**: Clique no botão Google (modo dev)
- **Login Apple**: Clique no botão Apple (modo dev)
- **Login Email**: Use email e senha cadastrados

### 3. Dashboard
- Após o login, você será redirecionado para o dashboard
- Clique em "Novo agendamento"
- Preencha: Filial → Profissional → Serviço → Data/Hora
- Confirme o agendamento

### 4. Verificar Agendamentos
- No dashboard, você verá seus agendamentos listados
- Cada usuário tem seus próprios agendamentos

## 🔧 Modo de Desenvolvimento

O sistema está configurado para funcionar sem configuração de OAuth:

- **Google Login**: Simula login com dados mock
- **Apple Login**: Simula login com dados mock
- **Banco de Dados**: SQLite local
- **Tokens**: JWT com chaves de desenvolvimento

## 🚀 Para Produção

1. Configure as variáveis de ambiente no arquivo `.env`
2. Configure Google OAuth no Google Cloud Console
3. Configure Apple Sign In no Apple Developer Console
4. Descomente o código OAuth nos arquivos HTML
5. Use um banco de dados mais robusto (PostgreSQL/MySQL)
6. Configure HTTPS

## 📞 Suporte

Se encontrar problemas:
1. Verifique se o Node.js está instalado
2. Verifique se as portas 3000 ou 3001 estão livres
3. Verifique os logs do servidor no terminal
4. Limpe o cache do navegador

---

**BC Ducorte** - Seu novo estilo começa aqui ✂️
