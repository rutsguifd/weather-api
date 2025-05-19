import express from "express";
import { config } from "./config";
import subscribeRouter from "./routes/subscription.routes";
import weatherRouter from "./routes/weather.routes";
import { startAllSchedulers, stopAllSchedulers } from "./scheduler";
import { errorHandler } from "./middlewares/error.handler";

const app = express();
app.use(express.json());

app.use("/", subscribeRouter);

app.use("/weather", weatherRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

app.listen(config.port, async () => {
  console.log(`🚀 Server listening at ${config.baseUrl}`);
  stopAllSchedulers();
  await startAllSchedulers();
});
