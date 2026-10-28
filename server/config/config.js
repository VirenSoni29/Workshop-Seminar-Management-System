import dotenv from "dotenv";

dotenv.config();

const required = ["MONGO_URI", "JWT_SECRET"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
   throw new Error(`Missing required env variables: ${missing.join(", ")}`);
}

const config = {
   port: process.env.PORT || 5000,
   nodeEnv: process.env.NODE_ENV || "development",
   mongoUri: process.env.MONGO_URI,
   jwtSecret: process.env.JWT_SECRET,
   jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
   clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
};

export default config;
