const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { OAuth2Client } = require('google-auth-library');
const appleSignin = require('apple-signin-auth');
const devConfig = require('./config-dev');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = devConfig.port;

// Middleware de segurança com configuração personalizada
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "https://images.pexels.com", "https://upload.wikimedia.org"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            connectSrc: ["'self'"],
            frameSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            manifestSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:5500', 'file://'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '.')));

// Rate limiting
const limiter = rateLimit({
    windowMs: devConfig.rateLimitWindowMs,
    max: devConfig.rateLimitMaxRequests,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use('/api/', limiter);

// Configuração do banco de dados SQLite
const db = new sqlite3.Database(devConfig.databaseUrl, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados SQLite');
        initializeDatabase();
    }
});

// Inicializar tabelas do banco de dados
function initializeDatabase() {
    db.serialize(() => {
        // Tabela de usuários
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            google_id TEXT,
            apple_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabela de tokens de refresh
        db.run(`CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Tabela de agendamentos
        db.run(`CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            branch TEXT NOT NULL,
            professional TEXT NOT NULL,
            service TEXT NOT NULL,
            datetime TEXT NOT NULL,
            status TEXT DEFAULT 'confirmed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
    });
}

// Middleware para verificar JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    jwt.verify(token, devConfig.jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado' });
        }
        req.user = user;
        next();
    });
}

// Função para gerar tokens
function generateTokens(userId) {
    const accessToken = jwt.sign(
        { userId, type: 'access' },
        devConfig.jwtSecret,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { userId, type: 'refresh' },
        devConfig.jwtRefreshSecret,
        { expiresIn: '7d' }
    );

    // Salvar refresh token no banco
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    db.run(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, refreshToken, expiresAt.toISOString()]
    );

    return { accessToken, refreshToken };
}

// Função para limpar tokens expirados
function cleanupExpiredTokens() {
    db.run('DELETE FROM refresh_tokens WHERE expires_at < datetime("now")');
}

// Executar limpeza a cada hora
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

// Rotas de autenticação
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validações
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
        }

        // Verificar se o email já existe
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }

            if (row) {
                return res.status(400).json({ error: 'Email já cadastrado' });
            }

            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, 12);

            // Inserir usuário
            db.run(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                [name, email, hashedPassword],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Erro ao criar usuário' });
                    }

                    const userId = this.lastID;
                    const tokens = generateTokens(userId);

                    // Buscar dados do usuário criado
                    db.get('SELECT id, name, email FROM users WHERE id = ?', [userId], (err, user) => {
                        if (err) {
                            return res.status(500).json({ error: 'Erro interno do servidor' });
                        }

                        res.status(201).json({
                            message: 'Usuário criado com sucesso',
                            user: {
                                id: user.id,
                                name: user.name,
                                email: user.email
                            },
                            accessToken: tokens.accessToken,
                            refreshToken: tokens.refreshToken
                        });
                    });
                }
            );
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        // Buscar usuário
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Email ou senha incorretos' });
            }

            // Verificar senha
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Email ou senha incorretos' });
            }

            const tokens = generateTokens(user.id);

            res.json({
                message: 'Login realizado com sucesso',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                },
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Login com Google
app.post('/api/auth/google', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: 'Token do Google é obrigatório' });
        }

        // Verificar token do Google
        if (!devConfig.google.enabled) {
            // Modo de desenvolvimento - simular login Google
            const mockUser = {
                email: 'usuario.google@gmail.com',
                name: 'Usuário Google',
                sub: 'google_' + Date.now()
            };
            
            // Buscar ou criar usuário
            db.get('SELECT * FROM users WHERE email = ? OR google_id = ?', [mockUser.email, mockUser.sub], (err, user) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro interno do servidor' });
                }

                if (user) {
                    // Usuário existe, fazer login
                    const tokens = generateTokens(user.id);
                    res.json({
                        message: 'Login com Google realizado com sucesso (modo dev)',
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email
                        },
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken
                    });
                } else {
                    // Criar novo usuário
                    db.run(
                        'INSERT INTO users (name, email, google_id) VALUES (?, ?, ?)',
                        [mockUser.name, mockUser.email, mockUser.sub],
                        function(err) {
                            if (err) {
                                return res.status(500).json({ error: 'Erro ao criar usuário' });
                            }

                            const userId = this.lastID;
                            const tokens = generateTokens(userId);

                            res.status(201).json({
                                message: 'Usuário criado com sucesso via Google (modo dev)',
                                user: {
                                    id: userId,
                                    name: mockUser.name,
                                    email: mockUser.email
                                },
                                accessToken: tokens.accessToken,
                                refreshToken: tokens.refreshToken
                            });
                        }
                    );
                }
            });
            return;
        }

        const client = new OAuth2Client(devConfig.google.clientId);
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: devConfig.google.clientId
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        // Buscar ou criar usuário
        db.get('SELECT * FROM users WHERE email = ? OR google_id = ?', [email, googleId], (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }

            if (user) {
                // Usuário existe, fazer login
                const tokens = generateTokens(user.id);
                res.json({
                    message: 'Login com Google realizado com sucesso',
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    },
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken
                });
            } else {
                // Criar novo usuário
                db.run(
                    'INSERT INTO users (name, email, google_id) VALUES (?, ?, ?)',
                    [name, email, googleId],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Erro ao criar usuário' });
                        }

                        const userId = this.lastID;
                        const tokens = generateTokens(userId);

                        res.status(201).json({
                            message: 'Usuário criado com sucesso via Google',
                            user: {
                                id: userId,
                                name: name,
                                email: email
                            },
                            accessToken: tokens.accessToken,
                            refreshToken: tokens.refreshToken
                        });
                    }
                );
            }
        });
    } catch (error) {
        console.error('Erro no login com Google:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Login com Apple
app.post('/api/auth/apple', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: 'Token da Apple é obrigatório' });
        }

        // Verificar token da Apple
        if (!devConfig.apple.enabled) {
            // Modo de desenvolvimento - simular login Apple
            const mockUser = {
                email: 'usuario.apple@privaterelay.appleid.com',
                name: 'Usuário Apple',
                sub: 'apple_' + Date.now()
            };
            
            // Buscar ou criar usuário
            db.get('SELECT * FROM users WHERE email = ? OR apple_id = ?', [mockUser.email, mockUser.sub], (err, user) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro interno do servidor' });
                }

                if (user) {
                    // Usuário existe, fazer login
                    const tokens = generateTokens(user.id);
                    res.json({
                        message: 'Login com Apple realizado com sucesso (modo dev)',
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email
                        },
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken
                    });
                } else {
                    // Criar novo usuário
                    db.run(
                        'INSERT INTO users (name, email, apple_id) VALUES (?, ?, ?)',
                        [mockUser.name, mockUser.email, mockUser.sub],
                        function(err) {
                            if (err) {
                                return res.status(500).json({ error: 'Erro ao criar usuário' });
                            }

                            const userId = this.lastID;
                            const tokens = generateTokens(userId);

                            res.status(201).json({
                                message: 'Usuário criado com sucesso via Apple (modo dev)',
                                user: {
                                    id: userId,
                                    name: mockUser.name,
                                    email: mockUser.email
                                },
                                accessToken: tokens.accessToken,
                                refreshToken: tokens.refreshToken
                            });
                        }
                    );
                }
            });
            return;
        }

        const appleResponse = await appleSignin.verifyIdToken(idToken, {
            audience: devConfig.apple.clientId
        });

        const { email, sub: appleId } = appleResponse;
        const name = appleResponse.name?.firstName || 'Usuário Apple';

        // Buscar ou criar usuário
        db.get('SELECT * FROM users WHERE email = ? OR apple_id = ?', [email, appleId], (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }

            if (user) {
                // Usuário existe, fazer login
                const tokens = generateTokens(user.id);
                res.json({
                    message: 'Login com Apple realizado com sucesso',
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    },
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken
                });
            } else {
                // Criar novo usuário
                db.run(
                    'INSERT INTO users (name, email, apple_id) VALUES (?, ?, ?)',
                    [name, email, appleId],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Erro ao criar usuário' });
                        }

                        const userId = this.lastID;
                        const tokens = generateTokens(userId);

                        res.status(201).json({
                            message: 'Usuário criado com sucesso via Apple',
                            user: {
                                id: userId,
                                name: name,
                                email: email
                            },
                            accessToken: tokens.accessToken,
                            refreshToken: tokens.refreshToken
                        });
                    }
                );
            }
        });
    } catch (error) {
        console.error('Erro no login com Apple:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Refresh token
app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token é obrigatório' });
    }

    jwt.verify(refreshToken, devConfig.jwtRefreshSecret, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Refresh token inválido' });
        }

        // Verificar se o token existe no banco
        db.get('SELECT user_id FROM refresh_tokens WHERE token = ? AND expires_at > datetime("now")', [refreshToken], (err, row) => {
            if (err || !row) {
                return res.status(403).json({ error: 'Refresh token inválido ou expirado' });
            }

            const newTokens = generateTokens(row.user_id);
            res.json({
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken
            });
        });
    });
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }

    res.json({ message: 'Logout realizado com sucesso' });
});

// Perfil do usuário
app.get('/api/auth/profile', authenticateToken, (req, res) => {
    db.get('SELECT id, name, email FROM users WHERE id = ?', [req.user.userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ user });
    });
});

// Rotas de agendamentos
app.post('/api/appointments', authenticateToken, (req, res) => {
    const { branch, professional, service, datetime } = req.body;
    const userId = req.user.userId;

    if (!branch || !professional || !service || !datetime) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    db.run(
        'INSERT INTO appointments (user_id, branch, professional, service, datetime) VALUES (?, ?, ?, ?, ?)',
        [userId, branch, professional, service, datetime],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao criar agendamento' });
            }

            res.status(201).json({
                message: 'Agendamento criado com sucesso',
                appointment: {
                    id: this.lastID,
                    branch,
                    professional,
                    service,
                    datetime,
                    status: 'confirmed'
                }
            });
        }
    );
});

app.get('/api/appointments', authenticateToken, (req, res) => {
    const userId = req.user.userId;

    db.all('SELECT * FROM appointments WHERE user_id = ? ORDER BY datetime DESC', [userId], (err, appointments) => {
        if (err) {
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        res.json({ appointments });
    });
});

// Rota para servir arquivos HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing-barbearia.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login pagina.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});
