import express from "express";
import request from "supertest";
import { SubscriptionController } from "../../controllers/subscription.controller";
import router from "../subscription.routes";

jest.mock("../../controllers/subscription.controller");

describe("/subscribe routes", () => {
  let app: express.Express;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/", router);
  });

  it("POST /subscribe calls validate and controller", async () => {
    (SubscriptionController.create as jest.Mock).mockImplementation(
      (req, res) => res.status(200).json({ ok: true })
    );
    const res = await request(app)
      .post("/subscribe")
      .send({ email: "a@b.com", city: "Kyiv", frequency: "daily" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(SubscriptionController.create).toHaveBeenCalled();
  });

  it("GET /subscribe calls stream controller", async () => {
    (SubscriptionController.stream as jest.Mock).mockImplementation(
      (req, res) => res.status(200).json({ stream: true })
    );
    const res = await request(app).get("/subscribe?token=abc&sseToken=def");
    expect(res.status).toBe(200);
    expect(res.body.stream).toBe(true);
    expect(SubscriptionController.stream).toHaveBeenCalled();
  });

  it("GET /confirm/:token calls confirm controller", async () => {
    (SubscriptionController.confirm as jest.Mock).mockImplementation(
      (req, res) => res.status(200).json({ confirmed: true })
    );
    const res = await request(app).get("/confirm/abc123");
    expect(res.status).toBe(200);
    expect(res.body.confirmed).toBe(true);
    expect(SubscriptionController.confirm).toHaveBeenCalled();
  });

  it("GET /unsubscribe/:token calls unsubscribe controller", async () => {
    (SubscriptionController.unsubscribe as jest.Mock).mockImplementation(
      (req, res) => res.status(200).json({ unsubscribed: true })
    );
    const res = await request(app).get("/unsubscribe/abc123");
    expect(res.status).toBe(200);
    expect(res.body.unsubscribed).toBe(true);
    expect(SubscriptionController.unsubscribe).toHaveBeenCalled();
  });
});
