import app from "./app.js";
import config from "./config/config.js";
import connectDB from "./config/db.js";

const startServer = async () => {
   await connectDB();

   const server = app.listen(config.port, () => {
      console.log(
         `✅ Server running in ${config.nodeEnv} mode on port ${config.port}`,
      );
   });

   process.on("unhandledRejection", (err) => {
      console.error(`Unhandled rejection: ${err.message}`);
      server.close(() => process.exit(1));
   });
};

startServer();
