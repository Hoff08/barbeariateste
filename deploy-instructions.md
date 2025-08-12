# Instruções de Deploy - BC Ducorte

## Opção 1: Deploy Local (Servidor Web)

### Passos:
1. **Faça backup** dos arquivos atuais
2. **Upload dos arquivos** para o servidor web:
   - `dashboard.html` → `public_html/` ou `www/`
   - `admin-panel.html` → `public_html/`
   - `barber-panel.html` → `public_html/`
   - `clients-panel.html` → `public_html/`
   - `owner-panel.html` → `public_html/`
   - `landing-barbearia.html` → `public_html/`

3. **Configure o servidor** para servir arquivos estáticos
4. **Acesse**: `https://cambo.com.br/dashboard.html`

### Estrutura de Pastas Recomendada:
```
public_html/
├── dashboard.html
├── admin-panel.html
├── barber-panel.html
├── clients-panel.html
├── owner-panel.html
├── landing-barbearia.html
├── imagem/
└── SISTEMA_AUTENTICACAO.md
```

## Opção 2: GitHub Pages (Gratuito)

### Passos:
1. **Crie um repositório** no GitHub
2. **Faça upload** dos arquivos HTML
3. **Ative GitHub Pages** nas configurações
4. **Configure domínio personalizado** para `cambo.com.br`

### Comandos Git:
```bash
git init
git add .
git commit -m "Initial commit - BC Ducorte"
git remote add origin https://github.com/seu-usuario/bc-ducorte.git
git push -u origin main
```

## Opção 3: Netlify/Vercel (Gratuito)

### Netlify:
1. **Conecte** o repositório GitHub
2. **Configure build settings**:
   - Build command: (deixe vazio)
   - Publish directory: `.`
3. **Configure domínio personalizado**: `cambo.com.br`

### Vercel:
1. **Importe** o projeto
2. **Configure** como projeto estático
3. **Adicione domínio personalizado**

## Configurações Importantes:

### 1. **HTTPS**
- Certifique-se de que o site rode em HTTPS
- Configure certificado SSL

### 2. **CORS (se necessário)**
Se houver problemas com recursos externos:
```html
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
```

### 3. **Cache**
Configure cache adequado para melhor performance:
```apache
# .htaccess
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/html "access plus 1 hour"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

## Teste Após Deploy:

1. **Acesse** `https://cambo.com.br/dashboard.html`
2. **Teste login** com usuários:
   - Dono: `dono@barbearia.com` / `123456`
   - Funcionário: `funcionario1@barbearia.com` / `123456`
3. **Verifique** modo claro/escuro
4. **Teste** navegação entre painéis

## Suporte:

Se precisar de ajuda com o deploy específico do seu servidor, me informe:
- Tipo de hospedagem (cPanel, VPS, etc.)
- Sistema operacional do servidor
- Acesso disponível (FTP, SSH, etc.)
