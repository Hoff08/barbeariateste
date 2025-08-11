// Configuração para desenvolvimento sem OAuth
// Este arquivo permite testar o sistema sem configurar Google/Apple OAuth

const devConfig = {
    // Configurações do servidor
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // JWT Secrets (para desenvolvimento)
    jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_production',
    
    // Database
    databaseUrl: process.env.DATABASE_URL || './database.sqlite',
    
    // Rate Limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    
    // OAuth (desabilitado para desenvolvimento)
    google: {
        enabled: false,
        clientId: process.env.GOOGLE_CLIENT_ID || 'dev_google_client_id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dev_google_client_secret'
    },
    
    apple: {
        enabled: false,
        clientId: process.env.APPLE_CLIENT_ID || 'com.barbearia.ducorte.dev',
        teamId: process.env.APPLE_TEAM_ID || 'dev_team_id',
        keyId: process.env.APPLE_KEY_ID || 'dev_key_id',
        privateKey: process.env.APPLE_PRIVATE_KEY || 'dev_private_key'
    }
};

module.exports = devConfig;
