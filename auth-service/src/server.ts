import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { connectToDatabase, closeDatabase } from "./lib/db";
import { auth } from "./lib/auth";
import userRouter from "./routes/route";

const app = express();
const PORT = process.env.PORT || 8000;

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};


app.use(cors(corsOptions));
app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api/v1/users", userRouter);


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

    app.listen(PORT, () => {
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