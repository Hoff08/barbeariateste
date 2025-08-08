#!/bin/bash

echo "========================================"
echo "    Instalação do Sistema BC Ducorte"
echo "========================================"
echo

echo "Verificando se o Node.js está instalado..."
if ! command -v node &> /dev/null; then
    echo "ERRO: Node.js não encontrado!"
    echo "Por favor, instale o Node.js em: https://nodejs.org/"
    exit 1
fi

echo "Node.js encontrado!"
echo

echo "Instalando dependências..."
npm install
if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao instalar dependências!"
    exit 1
fi

echo
echo "Criando arquivo .env..."
if [ ! -f .env ]; then
    cat > .env << EOF
PORT=3000
NODE_ENV=development
JWT_SECRET=sua_chave_jwt_super_secreta_aqui_mude_em_producao
JWT_REFRESH_SECRET=sua_chave_refresh_jwt_super_secreta_aqui_mude_em_producao
GOOGLE_CLIENT_ID=seu_google_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_google_client_secret_aqui
APPLE_CLIENT_ID=com.barbearia.ducorte
APPLE_TEAM_ID=seu_apple_team_id_aqui
APPLE_KEY_ID=seu_apple_key_id_aqui
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nsua_chave_privada_apple_aqui\n-----END PRIVATE KEY-----
DATABASE_URL=./database.sqlite
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    echo "Arquivo .env criado com configurações padrão!"
else
    echo "Arquivo .env já existe!"
fi

echo
echo "========================================"
echo "    Instalação concluída com sucesso!"
echo "========================================"
echo
echo "Para iniciar o servidor, execute:"
echo "npm run dev"
echo
echo "Para configurar o Google OAuth e Apple Sign In,"
echo "consulte o arquivo README.md"
echo
