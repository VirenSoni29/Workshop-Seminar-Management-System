import mongoose from "mongoose";
import config from "./config.js";

let cached = global.mongoose;
if (!cached) {
   cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
   if (cached.conn) return cached.conn;

   if (!cached.promise) {
      cached.promise = mongoose
         .connect(config.mongoUri, {
            bufferCommands: false,
         })
         .then((conn) => {
            console.log(`✅ MongoDB connected: ${conn.connection.host}`);
            return conn;
         });
   }

   try {
      cached.conn = await cached.promise;
   } catch (error) {
      cached.promise = null;
      console.error(`❌ MongoDB connection error: ${error.message}`);
      throw error;
   }

   return cached.conn;
};

export default connectDB;