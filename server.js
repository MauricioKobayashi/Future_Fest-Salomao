import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import path from "path";
import { fileURLToPath } from 'url';
import session from "express-session";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// SIMULAÇÃO TEMPORÁRIA - Banco em memória
const usuariosTemporarios = new Map();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Configuração da sessão
app.use(session({
    secret: process.env.SESSION_SECRET || "segredo-super-seguro-salomao",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const perguntas = [
    "Como está sua situação financeira?",
    "Qual sua renda mensal?",
    "Quanto gasta por mês?",
    "Tem dívidas? Se sim quanto?",
    "Consegue guardar quanto por mês?",
    "Qual seu objetivo financeiro?"
];

function extrairNumero(texto) {
    if (!texto) return 0;
    texto = texto.toString().replace(/\./g, '').replace(',', '.');
    const match = texto.match(/(\d+[,.]?\d*)/);
    return match ? parseFloat(match[0]) : 0;
}

// ===== ROTA DE STATUS DE AUTENTICAÇÃO =====
app.get('/api/auth/status', (req, res) => {
    res.json({
        loggedIn: !!req.session.usuario,
        usuario: req.session.usuario || null
    });
});

// ===== ROTAS DE AUTENTICAÇÃO =====

// Páginas de autenticação - AGORA NA PASTA PUBLIC
app.get('/login', (req, res) => {
    if (req.session.usuario) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/registro', (req, res) => {
    if (req.session.usuario) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'registro.html'));
});

// Registrar usuário (versão temporária)
app.post('/registro', async (req, res) => {
    const { usuario, senha } = req.body;
    
    if (usuariosTemporarios.has(usuario)) {
        return res.redirect('/registro?erro=Usuario+ja+existente');
    }
    
    try {
        usuariosTemporarios.set(usuario, { 
            senha: senha,
            dataCriacao: new Date() 
        });
        res.redirect('/login?sucesso=Conta+criada+com+sucesso');
    } catch (erro) {
        console.error(erro);
        res.redirect('/registro?erro=Erro+ao+registrar');
    }
});

// Login (versão temporária)
app.post('/login', async (req, res) => {
    const { usuario, senha } = req.body;
    const usuarioSalvo = usuariosTemporarios.get(usuario);
    
    try {
        if (usuarioSalvo && usuarioSalvo.senha === senha) {
            req.session.usuario = usuario;
            res.redirect('/');
        } else {
            res.redirect('/login?erro=Credenciais+incorretas');
        }
    } catch (erro) {
        console.error(erro);
        res.redirect('/login?erro=Erro+ao+logar');
    }
});

// Logout
app.get('/sair', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// ===== ROTAS DO SITE SALOMÃO =====

// Servir páginas HTML - TODAS DESBLOQUEADAS
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/ai', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ai.html'));
});

app.get('/artigos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'artigos.html'));
});

app.get('/area-aluno', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'area-aluno.html'));
});

// API do Chat - DESBLOQUEADA
app.post("/chat", async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        const step = history.filter(m => m.role === "assistant").length;

        if (step >= 6) {
            const userMessages = history.filter(m => m.role === 'user').map(m => m.content);
            
            const dados = {
                renda: extrairNumero(userMessages[1]),
                gastos: extrairNumero(userMessages[2]),
                dividas: extrairNumero(userMessages[3]),
                economia: extrairNumero(userMessages[4]),
                objetivo: userMessages[5] || "Não especificado"
            };

            // Análise simples sem IA
            const resultado = {
                ...dados,
                resumo: `Renda: R$ ${dados.renda}, Gastos: R$ ${dados.gastos}, Economia: R$ ${dados.economia}`,
                organizacao: dados.economia > 0 ? "Boa organização!" : "Precisa economizar mais.",
                plano: [
                    "Controlar gastos mensais",
                    "Criar reserva de emergência",
                    "Planejar objetivos financeiros"
                ]
            };

            return res.json({ finished: true, data: resultado });
        }

        res.json({ finished: false, reply: perguntas[step] });

    } catch (err) {
        console.log("Erro:", err);
        res.status(500).json({ error: "Erro interno" });
    }
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(3000, () => console.log("Servidor Salomão rodando em http://localhost:3000"));