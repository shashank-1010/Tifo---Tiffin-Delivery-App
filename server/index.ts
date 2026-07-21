import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectDB } from "./db";
import { createDefaultAdmin } from "./seed";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import path from "path";

// ✅ Load environment variables at the top
dotenv.config();

const app = express();

// ✅ SECURITY MIDDLEWARE - ORDER MATTERS!

// 1. Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:"],
      connectSrc: ["'self'"],
    },
  } : false,
  crossOriginEmbedderPolicy: false
}));

// 2. CORS - Configure properly
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 3. Body parser with limits
app.use(express.json({ 
  limit: '10kb'
}));
app.use(express.urlencoded({ 
  extended: false, 
  limit: '10kb' 
}));

// ✅ TURNSTILE BYPASS MIDDLEWARE
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api/auth/login' || req.path === '/api/auth/register') {
    if (req.body && req.body.turnstileToken) {
      console.log('🔧 Removing turnstileToken from request:', req.body.turnstileToken);
      delete req.body.turnstileToken;
    }
  }
  next();
});

// 4. Data sanitization
app.use(mongoSanitize());

// 5. Prevent parameter pollution
app.use(hpp());

// 6. Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many login attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limits
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ✅ Check JWT secret
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET missing in .env file!");
  process.exit(1);
} else {
  console.log("✅ JWT_SECRET loaded successfully");
}

// ✅ Request logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: any = undefined;

  const originalResJson = res.json.bind(res);

  res.json = ((body: any): Response => {
    capturedJsonResponse = body;
    return originalResJson(body);
  }) as typeof res.json;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        try {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch {
          logLine += " :: [unserializable response]";
        }
      }
      if (logLine.length > 120) logLine = logLine.slice(0, 119) + "…";
      log ? log(logLine) : console.log(logLine);
    }
  });

  next();
});

// ✅ TELEGRAM BOT - DISABLED FOR RENDER (To avoid 409 conflict)
// Telegram polling doesn't work well with multiple Render instances
// Use webhook instead if needed
function setupTelegramBotDisabled() {
  console.log('ℹ️ Telegram bot polling disabled on Render (to prevent conflicts)');
  console.log('💡 Tip: Use Telegram webhooks for production');
  return;
}

// ✅ Main async block
(async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    await createDefaultAdmin();

    // Disable Telegram bot on Render
    setupTelegramBotDisabled();

    // Register all routes
    const server = await registerRoutes(app);

    // ✅ IMPORTANT: Vite setup
    if (app.get("env") === "development") {
      console.log("🔧 Setting up Vite dev server...");
      await setupVite(app, server);
    } else {
      console.log("📁 Serving static files...");
      serveStatic(app);
    }

    // ✅ Root route
    app.get("/", (req: Request, res: Response) => {
      if (app.get("env") === "development") {
        const devPort = process.env.PORT || 5000;
        res.redirect(`http://localhost:${devPort}`);
      } else {
        res.json({ 
          message: "Tiffin Service API is running!",
          version: "1.0.0",
          status: "active",
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || "development"
        });
      }
    });

    // ✅ Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("❌ Error:", err);
      res.status(status).json({ message });
    });

    // ✅ FIXED: CRITICAL - Listen on 0.0.0.0 with PORT env variable
    const PORT = parseInt(process.env.PORT || "5000", 10);
    const HOST = "0.0.0.0"; // MUST BE 0.0.0.0 for Render

    console.log(`🔄 Attempting to start server on ${HOST}:${PORT}...`);

    server.listen(PORT, HOST, () => {
      console.log(`🚀 Server successfully running on ${HOST}:${PORT}`);
      console.log(`📡 Server is accessible on port ${PORT}`);
      if (process.env.NODE_ENV === 'production') {
        console.log('✅ Production mode - Ready for Render');
      }
    });

    server.on("error", (err: any) => {
      console.error("❌ Server failed to start:", err.message);
      console.error("Error details:", err);
      process.exit(1);
    });

    // Add graceful shutdown
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM received. Closing server gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (err: any) {
    console.error("💥 Startup error:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  }
})();
