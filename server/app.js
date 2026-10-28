import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import config from "./config/config.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { sendSuccess } from "./utils/response.js";

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

app.use(notFound);
app.use(errorHandler);

export default app;
