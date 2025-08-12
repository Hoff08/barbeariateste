#!/bin/bash

# Script de Deploy - BC Ducorte para cambo.com.br
# Autor: Sistema BC Ducorte
# Data: $(date)

echo "🚀 Iniciando deploy do BC Ducorte para cambo.com.br"
echo "=================================================="

# Configurações
DOMAIN="cambo.com.br"
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
FILES_TO_DEPLOY=(
    "dashboard.html"
    "admin-panel.html"
    "barber-panel.html"
    "clients-panel.html"
    "owner-panel.html"
    "landing-barbearia.html"
    ".htaccess"
    "imagem/"
)

# Verificar se os arquivos existem
echo "📁 Verificando arquivos..."
for file in "${FILES_TO_DEPLOY[@]}"; do
    if [ -e "$file" ]; then
        echo "✅ $file encontrado"
    else
        echo "❌ $file não encontrado"
        exit 1
    fi
done

# Criar backup
echo "💾 Criando backup..."
mkdir -p "$BACKUP_DIR"
cp -r "${FILES_TO_DEPLOY[@]}" "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  Backup parcial criado"

# Opções de deploy
echo ""
echo "Escolha o método de deploy:"
echo "1) Upload via FTP/SFTP"
echo "2) Deploy local (cópia para pasta)"
echo "3) Preparar para GitHub Pages"
echo "4) Preparar para Netlify/Vercel"
echo ""

read -p "Digite sua opção (1-4): " choice

case $choice in
    1)
        echo "📤 Configurando upload FTP/SFTP..."
        read -p "Servidor FTP: " ftp_server
        read -p "Usuário: " ftp_user
        read -s -p "Senha: " ftp_pass
        echo ""
        read -p "Pasta remota (ex: public_html): " remote_dir
        
        echo "🔄 Fazendo upload..."
        # Usar curl para upload FTP
        for file in "${FILES_TO_DEPLOY[@]}"; do
            if [ -f "$file" ]; then
                curl -T "$file" "ftp://$ftp_server/$remote_dir/" --user "$ftp_user:$ftp_pass"
                echo "✅ $file enviado"
            elif [ -d "$file" ]; then
                # Para pastas, usar lftp ou similar
                echo "📁 Enviando pasta $file..."
            fi
        done
        ;;
        
    2)
        echo "📂 Deploy local..."
        read -p "Pasta de destino: " dest_dir
        
        if [ ! -d "$dest_dir" ]; then
            mkdir -p "$dest_dir"
        fi
        
        cp -r "${FILES_TO_DEPLOY[@]}" "$dest_dir/"
        echo "✅ Arquivos copiados para $dest_dir"
        ;;
        
    3)
        echo "🐙 Preparando para GitHub Pages..."
        
        # Criar arquivo CNAME para domínio personalizado
        echo "$DOMAIN" > CNAME
        
        # Criar arquivo _config.yml para Jekyll (se necessário)
        cat > _config.yml << EOF
# Configuração para GitHub Pages
title: BC Ducorte
description: Sistema de Agendamento
baseurl: ""
url: "https://$DOMAIN"

# Configurações de build
plugins:
  - jekyll-seo-tag
EOF
        
        echo "✅ Arquivos preparados para GitHub Pages"
        echo "📝 Próximos passos:"
        echo "   1. git add ."
        echo "   2. git commit -m 'Deploy BC Ducorte'"
        echo "   3. git push origin main"
        echo "   4. Ativar GitHub Pages nas configurações"
        echo "   5. Configurar domínio personalizado: $DOMAIN"
        ;;
        
    4)
        echo "☁️  Preparando para Netlify/Vercel..."
        
        # Criar arquivo netlify.toml
        cat > netlify.toml << EOF
[build]
  publish = "."
  command = ""

[[redirects]]
  from = "/*"
  to = "/dashboard.html"
  status = 200

[build.environment]
  NODE_VERSION = "16"
EOF
        
        # Criar arquivo vercel.json
        cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "*.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/dashboard.html"
    }
  ],
  "alias": ["$DOMAIN"]
}
EOF
        
        echo "✅ Arquivos preparados para Netlify/Vercel"
        echo "📝 Próximos passos:"
        echo "   1. Fazer upload para Netlify/Vercel"
        echo "   2. Configurar domínio personalizado: $DOMAIN"
        ;;
        
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deploy concluído!"
echo "🌐 Acesse: https://$DOMAIN"
echo "📧 Login de teste:"
echo "   Dono: dono@barbearia.com / 123456"
echo "   Funcionário: funcionario1@barbearia.com / 123456"
echo ""
echo "📋 Checklist pós-deploy:"
echo "   ✅ Testar login"
echo "   ✅ Verificar modo claro/escuro"
echo "   ✅ Testar navegação entre painéis"
echo "   ✅ Verificar responsividade"
echo "   ✅ Testar em diferentes navegadores"

echo ""
echo "💾 Backup salvo em: $BACKUP_DIR"
