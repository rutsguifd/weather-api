import { SubscriptionController } from "../subscription.controller";
import { Request, Response } from "express";

jest.mock("../../prisma", () => ({
  prisma: {
    userSubscription: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));
jest.mock("../../services/subscription.service", () => ({
  createSubscription: jest.fn(),
  deleteSubscription: jest.fn(),
}));
jest.mock("../../services/email.service", () => ({
  sendEmail: jest.fn(),
}));
jest.mock("../../scheduler", () => ({
  scheduleNewSubscription: jest.fn(),
  unscheduleSubscription: jest.fn(),
}));
jest.mock("../../services/weather.service", () => ({
  fetchWeather: jest.fn(),
}));

const { prisma } = require("../../prisma");
const {
  createSubscription,
  deleteSubscription,
} = require("../../services/subscription.service");
const { sendEmail } = require("../../services/email.service");
const {
  scheduleNewSubscription,
  unscheduleSubscription,
} = require("../../scheduler");
const { fetchWeather } = require("../../services/weather.service");

describe("SubscriptionController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {}, on: jest.fn() };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("returns 400 for invalid webhookUrl", async () => {
      req.body = { webhookUrl: "bad-url", city: "Kyiv", frequency: "daily" };
      await SubscriptionController.create(
        req as Request,
        res as Response,
        next
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid webhookUrl" });
    });

    it("returns 400 for invalid frequency", async () => {
      req.body = { city: "Kyiv", frequency: "weekly" };
      await SubscriptionController.create(
        req as Request,
        res as Response,
        next
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "frequency must be hourly or daily",
      });
    });

    it("creates subscription, sends email, schedules, and returns 200", async () => {
      req.body = { email: "a@b.com", city: "Kyiv", frequency: "daily" };
      createSubscription.mockResolvedValue({
        id: 1,
        city: "Kyiv",
        sseToken: "sse",
        token: "tok",
        createdAt: "now",
      });
      await SubscriptionController.create(
        req as Request,
        res as Response,
        next
      );
      expect(createSubscription).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
      expect(scheduleNewSubscription).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          city: "Kyiv",
          sseToken: "sse",
          token: "tok",
          createdAt: "now",
        })
      );
    });

    it("handles error and returns error status", async () => {
      req.body = { city: "Kyiv", frequency: "daily" };
      createSubscription.mockRejectedValue({ status: 409, message: "fail" });
      await SubscriptionController.create(
        req as Request,
        res as Response,
        next
      );
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: "fail" });
    });
  });

  describe("stream", () => {
    it("returns 400 if missing query params", async () => {
      req.query = {};
      await SubscriptionController.stream(
        req as Request,
        res as Response,
        next
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining("token and sseToken"),
      });
    });

    it("returns 404 if subscription not found or not confirmed", async () => {
      req.query = { token: "tok", sseToken: "sse" };
      prisma.userSubscription.findFirst.mockResolvedValue(null);
      await SubscriptionController.stream(
        req as Request,
        res as Response,
        next
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining("not found"),
      });
    });

    it("streams weather data if subscription is confirmed", async () => {
      req.query = { token: "tok", sseToken: "sse" };
      prisma.userSubscription.findFirst.mockResolvedValue({
        city: "Kyiv",
        interval: 1,
        emailConfirmed: true,
      });
      fetchWeather.mockResolvedValue({ temp: 1 });
      const onMock = jest.fn();
      req.on = onMock;
      await SubscriptionController.stream(
        req as Request,
        res as Response,
        next
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "text/event-stream"
      );
      expect(res.write).toHaveBeenCalled();
      expect(onMock).toHaveBeenCalled();
    });
  });

  describe("confirm", () => {
    it("returns 400 if no token", async () => {
      req.params = {};
      await SubscriptionController.confirm(
        req as Request,
        res as Response,
        next
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    });

    it("returns 404 if token not found", async () => {
      req.params = { token: "tok" };
      prisma.userSubscription.findUnique.mockResolvedValue(null);
      await SubscriptionController.confirm(
        req as Request,
        res as Response,
        next
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Token not found" });
    });

    it("updates and confirms subscription", async () => {
      req.params = { token: "tok" };
      prisma.userSubscription.findUnique.mockResolvedValue({ id: 1 });
      prisma.userSubscription.update.mockResolvedValue({});
      await SubscriptionController.confirm(
        req as Request,
        res as Response,
        next
      );
      expect(prisma.userSubscription.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { emailConfirmed: true },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("confirmed"),
      });
    });
  });

  describe("unsubscribe", () => {
    it("returns 400 if no token", async () => {
      req.params = {};
      await SubscriptionController.unsubscribe(
        req as Request,
        res as Response,
        next
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    });

    it("returns 404 if token not found", async () => {
      req.params = { token: "tok" };
      prisma.userSubscription.findUnique.mockResolvedValue(null);
      await SubscriptionController.unsubscribe(
        req as Request,
        res as Response,
        next
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Token not found" });
    });

    it("deletes and unschedules subscription", async () => {
      req.params = { token: "tok" };
      prisma.userSubscription.findUnique.mockResolvedValue({ id: 1 });
      deleteSubscription.mockResolvedValue({});
      await SubscriptionController.unsubscribe(
        req as Request,
        res as Response,
        next
      );
      expect(deleteSubscription).toHaveBeenCalledWith(1);
      expect(unscheduleSubscription).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("Unsubscribed"),
      });
    });
  });
});
