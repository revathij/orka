import express from "express";
import cors from "cors";
import eventsRouter from "./routes/events.js";
import vendorsRouter from "./routes/vendors.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/events", eventsRouter);
  app.use("/api/vendors", vendorsRouter);
  app.use(errorHandler);

  return app;
}
