import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

const app = express();
const port = 8000;

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.all('/api/auth/{*any}', toNodeHandler(auth));

// 4. Start the server
app.listen(port, () => {
    console.log(`Better Auth app listening on port ${port}`);
});