import express from "express";
import request from "supertest";
import { WeatherController } from "../../controllers/weather.controller";
import router from "../weather.routes";

jest.mock("../../controllers/weather.controller");

describe("/weather routes", () => {
  let app: express.Express;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/weather", router);
  });

  it("GET /weather calls WeatherController.current", async () => {
    (WeatherController.current as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json({ weather: true })
    );
    const res = await request(app).get("/weather?city=Kyiv");
    expect(res.status).toBe(200);
    expect(res.body.weather).toBe(true);
    expect(WeatherController.current).toHaveBeenCalled();
  });
});
