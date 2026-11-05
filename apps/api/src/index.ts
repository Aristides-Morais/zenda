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
import { storeRouter, ecomAdminRouter } from "./modules/ecommerce/ecommerce.routes.js"; // NOVO
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", service: "zenda-api", time: new Date().toISOString() });
});

// Rotas do Zenda
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/customers", customerRouter);
app.use("/api/v1/sales", saleRouter);
app.use("/api/v1/expenses", expenseRouter);
app.use("/api/v1/business", businessRouter);

// Rotas do Kanda (E-commerce)
app.use("/api/v1/store", storeRouter);
app.use("/api/v1/ecom", ecomAdminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Zenda API a correr na porta ${env.PORT}`);
});