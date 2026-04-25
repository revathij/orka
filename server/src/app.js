import express from "express";
import cors from "cors";
import timelineRouter from "./routes/timeline.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/events", timelineRouter);
  app.use(errorHandler);

  return app;
}
