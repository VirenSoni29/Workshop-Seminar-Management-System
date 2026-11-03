import { sendError } from "../utils/response.js";
import config from "../config/config.js";

export const notFound = (req, res) => {
   return sendError(res, {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      statusCode: 404,
   });
};

export const errorHandler = (err, req, res, next) => {
   let statusCode = err.statusCode || 500;
   let message = err.message;
   let errors;

   // Mongoose: bad ObjectId
   if (err.name === "CastError") {
      statusCode = 400;
      message = `Invalid ${err.path}: ${err.value}`;
   }

   // Mongo: unique index violation (duplicate email, duplicate registration)
   if (err.code === 11000) {
      statusCode = 409;
      const field = Object.keys(err.keyValue || {})[0] || "field";
      message = `Duplicate value for ${field}`;
   }

   // Mongoose: schema validation
   if (err.name === "ValidationError" && err.errors) {
      statusCode = 400;
      message = "Validation failed";
      errors = Object.values(err.errors).map((e) => ({
         field: e.path,
         message: e.message,
      }));
   }

   // JWT
   if (err.name === "JsonWebTokenError") {
      statusCode = 401;
      message = "Invalid token. Please log in again.";
   }
   if (err.name === "TokenExpiredError") {
      statusCode = 401;
      message = "Session expired. Please log in again.";
   }

   // Hide internals of unexpected bugs from the client, but log them
   if (statusCode === 500) {
      console.error("UNEXPECTED ERROR:", err);
      if (config.nodeEnv !== "development")
         message = "Something went wrong on the server";
   }

   return sendError(res, { message, statusCode, errors });
};
