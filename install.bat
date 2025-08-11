@echo off
echo ========================================
echo    Instalacao do Sistema BC Ducorte
echo ========================================
echo.

echo Verificando se o Node.js esta instalado...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js encontrado!
echo.

echo Instalando dependencias...
npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo Criando arquivo .env...
if not exist .env (
    echo PORT=3000 > .env
    echo NODE_ENV=development >> .env
    echo JWT_SECRET=dev_jwt_secret_change_in_production >> .env
    echo JWT_REFRESH_SECRET=dev_refresh_secret_change_in_production >> .env
    echo DATABASE_URL=./database.sqlite >> .env
    echo RATE_LIMIT_WINDOW_MS=900000 >> .env
    echo RATE_LIMIT_MAX_REQUESTS=100 >> .env
    echo Arquivo .env criado com configuracoes padrao!
) else (
    echo Arquivo .env ja existe!
)

echo.
echo ========================================
echo    Instalacao concluida com sucesso!
echo ========================================
echo.
echo Para iniciar o servidor, execute:
echo npm run dev
echo.
echo Para configurar o Google OAuth e Apple Sign In,
echo consulte o arquivo README.md
echo.
pause
