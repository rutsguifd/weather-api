import { Request, Response, NextFunction } from "express";
import { fetchWeather } from "../services/weather.service";

export class WeatherController {
  static async current(req: Request, res: Response, next: NextFunction) {
    try {
      const city = String(req.query.city || "");
      if (!city) {
        return res.status(400).json({ error: "city is required" });
      }
      const data = await fetchWeather(city);
      return res.status(200).json({
        temperature: data.temp,
        humidity: data.humidity,
        description: data.description,
        wind_speed: data.wind_speed,
        obs_time: data.obs_time,
      });
    } catch (err: any) {
      if (err.response?.status === 400 || err.response?.status === 404) {
        return res.status(404).json({ error: "City not found" });
      }
      next(err);
    }
  }
}
