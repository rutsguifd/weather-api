import axios from "axios";
import { config } from "../config";
import { prisma } from "../prisma";

export interface WeatherData {
  temp: number;
  humidity: number;
  description: string;
  wind_speed: number;
  obs_time: string;
}

export async function fetchWeather(city: string): Promise<WeatherData> {
  const resp = await axios.get("https://api.weatherapi.com/v1/current.json", {
    params: { q: city, key: config.weatherApiKey },
  });
  const entry = resp.data.current;
  return {
    temp: entry.temp_c,
    humidity: entry.humidity,
    description: entry.condition.text,
    wind_speed: entry.wind_kph,
    obs_time: entry.last_updated,
  };
}

export async function saveWeatherRecord(subscriptionId: number, rawData: any) {
  return prisma.weatherRecord.create({
    data: { subscriptionId, data: rawData },
  });
}
