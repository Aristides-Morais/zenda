import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
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

// 1. CORS deve ser o PRIMEIRO middleware a ser registado
const allowedOrigins = env.CORS_ORIGIN.split(",");
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// 2. Lidar explicitamente com requisições OPTIONS (preflight)
app.options("*", cors());

// 3. Outros middlewares (helmet, json, cookieParser) vêm depois
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", service: "zenda-api", time: new Date().toISOString() });
});

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