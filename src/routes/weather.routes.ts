import { Router } from "express";
import { WeatherController } from "../controllers/weather.controller";

const router = Router();

router.get("/", (req, res, next) => {
  WeatherController.current(req, res, next).catch(next);
});

export default router;
