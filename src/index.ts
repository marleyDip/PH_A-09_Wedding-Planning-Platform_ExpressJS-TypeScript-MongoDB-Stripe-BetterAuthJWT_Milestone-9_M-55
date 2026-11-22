import { createApp } from "./app.js";
import { closeDb, connectDb } from "./config/db.js";
import { env } from "./config/env.js";

async function main() {
  await connectDb();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`WedPlan API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`${signal} received. Shutting down gracefully...`);

    // Force shutdown if cleanup takes too long
    const forceShutdown = setTimeout(() => {
      console.error("Graceful shutdown timed out. Forcing exit...");
      process.exit(1);
    }, 10_000);

    forceShutdown.unref();

    try {
      // Stop accepting new connections and wait for existing requests
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      // Close MongoDB connection
      await closeDb();

      clearTimeout(forceShutdown);

      console.log("Server shut down successfully.");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

// Handle unexpected promise rejections
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
  process.exitCode = 1;
});

// Handle unexpected synchronous exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  console.error("Failed to start the server:", error);
  process.exit(1);
});

/* import { createApp } from "./app.js";
import { closeDb, connectDb } from "./config/db.js";
import { env } from "./config/env.js";

async function main() {
  await connectDb();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`WedPlan API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await closeDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref(); // don't hang forever on open connections
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

main().catch((err) => {
  console.error("Failed to start the server:", err);
  process.exit(1);
});
*/
