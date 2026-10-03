// src/server.ts
import dotenv from "dotenv";

const envFile =
  process.env.NODE_ENV === "docker" ? ".env.docker" : ".env.local";
dotenv.config({ path: envFile });
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import routes from "./routes/routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, async () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
