import { WeatherController } from "../weather.controller";
import { Request, Response } from "express";
const { fetchWeather } = require("../../services/weather.service");

jest.mock("../../services/weather.service", () => ({
  fetchWeather: jest.fn(),
}));

describe("WeatherController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("returns 400 if city is missing", async () => {
    req.query = {};
    await WeatherController.current(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "city is required" });
  });

  it("returns weather data if city is valid", async () => {
    req.query = { city: "Kyiv" };
    fetchWeather.mockResolvedValue({
      temp: 10,
      humidity: 80,
      description: "Cloudy",
      wind_speed: 5,
      obs_time: "2025-05-20 10:00",
    });
    await WeatherController.current(req as Request, res as Response, next);
    expect(fetchWeather).toHaveBeenCalledWith("Kyiv");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      temperature: 10,
      humidity: 80,
      description: "Cloudy",
      wind_speed: 5,
      obs_time: "2025-05-20 10:00",
    });
  });

  it("returns 404 if weather API returns 400/404", async () => {
    req.query = { city: "Nowhere" };
    fetchWeather.mockRejectedValue({ response: { status: 404 } });
    await WeatherController.current(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "City not found" });
  });

  it("calls next(err) for other errors", async () => {
    req.query = { city: "Kyiv" };
    const err = new Error("fail");
    fetchWeather.mockRejectedValue(err);
    await WeatherController.current(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
