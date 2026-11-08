import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { productRouter } from "./modules/product/product.routes.js";
import { customerRouter } from "./modules/customer/customer.routes.js";
import { saleRouter } from "./modules/sale/sale.routes.js";
import { expenseRouter } from "./modules/expense/expense.routes.js";
import { businessRouter } from "./modules/business/business.routes.js";
import { storeRouter, ecomAdminRouter } from "./modules/ecommerce/ecommerce.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

const app = express();

// 1. Configuração do Rate Limiter
// Permite 10 tentativas a cada 15 minutos por IP.
// Se passar, o servidor responde com erro 429 (Too Many Requests).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Demasiadas tentativas. Por favor, tente novamente mais tarde.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(","), credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", service: "zenda-api", time: new Date().toISOString() });
});

// 2. Aplicar o rate limit apenas às rotas mais sensíveis (auth)
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);
app.use("/api/v1/auth/refresh", authLimiter);

// Rotas normais (sem rate limit agressivo)
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/customers", customerRouter);
app.use("/api/v1/sales", saleRouter);
app.use("/api/v1/expenses", expenseRouter);
app.use("/api/v1/business", businessRouter);
app.use("/api/v1/store", storeRouter);
app.use("/api/v1/ecom", ecomAdminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Zenda API a correr na porta ${env.PORT}`);
});