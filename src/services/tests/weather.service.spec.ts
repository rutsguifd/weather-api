import * as weatherService from "../weather.service";
import axios from "axios";
import { prisma } from "../../prisma";

jest.mock("axios");
(prisma as any).weatherRecord = { create: jest.fn() };

describe("weather.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches weather data from API and maps fields", async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        current: {
          temp_c: 10,
          humidity: 80,
          condition: { text: "Cloudy" },
          wind_kph: 5,
          last_updated: "2025-05-20 10:00",
        },
      },
    });
    const result = await weatherService.fetchWeather("Kyiv");
    expect(axios.get).toHaveBeenCalledWith(
      "https://api.weatherapi.com/v1/current.json",
      expect.objectContaining({
        params: expect.objectContaining({ q: "Kyiv" }),
      })
    );
    expect(result).toEqual({
      temp: 10,
      humidity: 80,
      description: "Cloudy",
      wind_speed: 5,
      obs_time: "2025-05-20 10:00",
    });
  });

  it("saves weather record to DB", async () => {
    (prisma.weatherRecord.create as unknown as jest.Mock).mockResolvedValue({
      id: 1,
      subscriptionId: 2,
    });
    const result = await weatherService.saveWeatherRecord(2, { temp: 10 });
    expect(prisma.weatherRecord.create).toHaveBeenCalledWith({
      data: { subscriptionId: 2, data: { temp: 10 } },
    });
    expect(result).toEqual({ id: 1, subscriptionId: 2 });
  });
});
