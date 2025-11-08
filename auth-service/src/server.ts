import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import {closeDatabase, connectToDatabase } from "./lib/db";
import { auth } from "./lib/auth";
import userRouter from "./routes/route";
import authRouter from "./routes/authRoute";

const app = express();
const PORT: number = process.env.AUTH_PORT ? parseInt(process.env.AUTH_PORT, 10) : 8000;
const allowedOrigins = ['http://localhost:5173', 'http://localhost', 'http://localhost:80'];

interface CorsOriginCallback {
  (err: Error | null, allow?: boolean): void;
}

interface CustomCorsOptions {
  origin: (origin: string | null | undefined, callback: CorsOriginCallback) => void;
  credentials: boolean;
}

const corsOptions: CustomCorsOptions = {
  origin: function (origin: string | null | undefined, callback: CorsOriginCallback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
};


app.use(cors(corsOptions));
app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api/v1/users", userRouter);
app.use("/api/jwt", authRouter); 



app.get("/health", (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

async function startServer() {
  try {
    // Connect to MongoDB for profile service
    await connectToDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api/v1`);
      console.log(`Auth endpoints at http://localhost:${PORT}/api/auth`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await closeDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await closeDatabase();
  process.exit(0);
});

startServer();

export default app;