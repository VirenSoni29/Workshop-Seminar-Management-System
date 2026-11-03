import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import config from "./config/config.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { sendSuccess } from "./utils/response.js";

import authRoutes from './routes/authRoutes.js';
import workshopRoutes from './routes/workshopRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import checkinRoutes from './routes/checkinRoutes.js';

const app = express();

app.use(helmet());

app.use(
   cors({
      origin: config.clientUrl,
      credentials: true,
   }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (config.nodeEnv === "development") {
   app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
   sendSuccess(res, { message: "Workshop Management API is running" });
});

app.use('/api/auth', authRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/checkin', checkinRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
