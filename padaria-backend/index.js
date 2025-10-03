//index.js
require("dotenv").config();

const express = require("express");
const app = express();
const logger = require("./logs/utils/logger");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors"); // ✅ apenas UMA importação
const cron = require("node-cron");
const rateLimit = require("express-rate-limit");
const requestId = require("./middlewares/requestId");

// se usar ngrok/proxy, ajuda:
app.set("trust proxy", 1);

// ===== Banco =====
const conectarBanco = require("./config/database");
conectarBanco();

/* ===================== CORS ===================== */

// permite localhost e QUALQUER subdomínio do ngrok-free.app
function isAllowedOrigin(origin = "") {
  if (!origin) return true; // curl / apps nativas
  if (origin === "http://localhost:5173") return true;
  if (origin === "http://127.0.0.1:5173") return true;
  return /^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/i.test(origin);
}

const corsOptions = {
  origin(origin, cb) {
    cb(null, isAllowedOrigin(origin)); // true/false
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "ngrok-skip-browser-warning",
  ],
  credentials: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

/* ================================================= */

/* ================== Middlewares ================== */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    erro: "Muitas requisições vindas deste IP. Tente novamente mais tarde.",
  },
});
app.use(limiter);

// ====== HARDENING: correlação/limites/timeout ======
app.use(requestId());
/* ================================================= */

/* ======================= CRON ==================== */
let gerarEntregasDoDia = null;
try {
  ({ gerarEntregasDoDia } = require("./controllers/gerarEntregasDiarias"));
} catch {
  logger.warn(
    "Controller gerarEntregasDiarias não encontrado. CRON ficará inativo."
  );
}
if (typeof gerarEntregasDoDia === "function") {
  cron.schedule("0 0 * * *", () => {
    try {
      logger.info(
        `[${new Date().toISOString()}] Disparando geração automática das entregas do dia...`
      );
      Promise.resolve(gerarEntregasDoDia()).catch((e) =>
        logger.error("Erro no CRON gerarEntregasDoDia:", e)
      );
    } catch (e) {
      logger.error("Falha ao agendar job do CRON:", e);
    }
  });

  Promise.resolve(gerarEntregasDoDia()).catch((e) =>
    logger.error("Erro ao gerar entregas no boot:", e)
  );
}
/* ================================================= */

// Timeout educado: se a conexão ficar pendurada por muito tempo, fecha.
const REQUEST_TIMEOUT_MS = 30_000; // 30s

app.use((req, res, next) => {
  // aplica no socket/req; alguns proxies honram isso
  try {
    req.setTimeout(REQUEST_TIMEOUT_MS);
  } catch {}
  try {
    res.setTimeout?.(REQUEST_TIMEOUT_MS);
  } catch {}

  // fallback manual: encerra resposta se passar do tempo
  const t = setTimeout(() => {
    if (!res.headersSent) {
      res.status(503).json({
        erro: "Request timeout",
        requestId: req.requestId || null,
      });
    }
    try {
      res.end();
    } catch {}
  }, REQUEST_TIMEOUT_MS + 500); // leve folga

  res.on("finish", () => clearTimeout(t));
  res.on("close", () => clearTimeout(t));
  next();
});

/* ======================= Rotas =================== */
app.get("/", (_req, res) => res.send("Olá, Sistema de Entregas da Padaria!"));
// === Preflight CORS mais permissivo (cole ANTES das rotas) ===
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Vary", "Origin");

  if (req.method === "OPTIONS") {
    // libera todos os métodos usuais
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );

    // MUITO IMPORTANTE: ecoa exatamente os headers solicitados no preflight
    const reqHeaders = req.headers["access-control-request-headers"];
    res.header(
      "Access-Control-Allow-Headers",
      reqHeaders || "Authorization, Content-Type, ngrok-skip-browser-warning"
    );

    // se você não usa cookies, mantenha credentials false
    // res.header("Access-Control-Allow-Credentials", "false");

    return res.sendStatus(204);
  }

  next();
});
// handler final (depois das rotas)
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const body = {
    erro: err.message || "Erro interno",
    requestId: req.requestId || null,
  };
  if (process.env.NODE_ENV !== "production" && err.stack) {
    body.stack = err.stack; // só em dev
  }
  res.status(status).json(body);
});

app.use("/api/login", require("./routes/login"));
app.use("/api/token", require("./routes/tokens"));
app.use("/api/rotas-split", require("./routes/rotasSplitHoje"));
app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/padarias", require("./routes/padarias"));
app.use("/api/produtos", require("./routes/produtos"));
app.use("/api/clientes", require("./routes/clientes"));
app.use("/api/entregas", require("./routes/entregas"));
app.use("/api/entregas-avulsas", require("./routes/entregasAvulsas"));
app.use("/api/dev", require("./routes/dev"));
app.use("/api/rotas", require("./routes/rotas"));
app.use("/api/rota-entregador", require("./routes/rotaEntregador"));
app.use("/api/analitico", (req, _res, next) => {
  console.log("[ANALITICO HIT]", req.method, req.path);
  next();
});
app.use("/api/analitico", require("./routes/analitico"));
app.use("/api/config", require("./routes/config"));
app.use("/api/gerente", require("./routes/gerente"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/pagamentos", require("./routes/pagamentos"));
app.use("/api/caixa", require("./routes/caixa"));
app.use("/api/saldo-diario", require("./routes/saldoDiario"));
app.use("/api/teste-protegido", require("./routes/testeProtegido"));

/* ======================= 404 ===================== */
app.use((_req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});
/* ================================================= */

/* ======================= Start =================== */
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
  logger.info("Servidor iniciado");
});
/* ================================================= */
