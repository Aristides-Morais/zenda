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
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
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

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Zenda API a correr em http://localhost:${env.PORT}`);
});