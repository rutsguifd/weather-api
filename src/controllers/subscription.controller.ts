import { Request, Response, NextFunction } from "express";
import { isWebUri } from "valid-url";
import { prisma } from "../prisma";
import { fetchWeather } from "../services/weather.service";
import {
  createSubscription,
  deleteSubscription,
} from "../services/subscription.service";
import { scheduleNewSubscription, unscheduleSubscription } from "../scheduler";
import { sendEmail } from "../services/email.service";
import { config } from "../config";

const freqToInterval: Record<string, number> = { hourly: 3600, daily: 86400 };

export class SubscriptionController {
  static async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, webhookUrl, city, frequency } = req.body;

      if (webhookUrl && !isWebUri(webhookUrl)) {
        res.status(400).json({ error: "Invalid webhookUrl" });
        return;
      }

      const interval = freqToInterval[frequency as "hourly" | "daily"];
      if (!interval) {
        res.status(400).json({ error: "frequency must be hourly or daily" });
        return;
      }

      const sub = await createSubscription({
        email,
        webhookUrl,
        sseToken: req.body.sseToken,
        city,
        interval,
      });

      if (email) {
        const link = `${config.baseUrl}/confirm/${sub.token}`;
        await sendEmail(
          email,
          "Confirm your weather subscription",
          `Please confirm by visiting: ${link}`
        );
      }

      scheduleNewSubscription(sub);
      res.status(200).json({
        id: sub.id,
        city: sub.city,
        frequency,
        sseToken: sub.sseToken,
        token: sub.token,
        createdAt: sub.createdAt,
      });
    } catch (err: any) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message });
    }
  }

  /** SSE stream at GET /subscribe?token=...&sseToken=... */
  static async stream(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token, sseToken } = req.query;
      if (
        !token ||
        !sseToken ||
        Array.isArray(token) ||
        Array.isArray(sseToken)
      ) {
        res
          .status(400)
          .json({ error: "token and sseToken query parameters are required" });
        return;
      }

      const sub = await prisma.userSubscription.findFirst({
        where: { token, sseToken: sseToken },
      });
      if (!sub || !sub.emailConfirmed) {
        res
          .status(404)
          .json({ error: "Subscription not found or not confirmed" });
        return;
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const sendWeather = async () => {
        try {
          const data = await fetchWeather(sub.city);
          res.write(`data: ${JSON.stringify(data)}

`);
        } catch (e: any) {
          console.error("SSE error:", e.message);
          res.write(
            `event: error
data: ${JSON.stringify({ message: e.message })}

`
          );
        }
      };

      sendWeather();
      const intervalId = setInterval(sendWeather, sub.interval * 1000);
      req.on("close", () => clearInterval(intervalId));
    } catch (err) {
      next(err);
    }
  }

  static async confirm(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.params.token;
      if (!token) {
        res.status(400).json({ error: "Invalid token" });
        return;
      }
      const sub = await prisma.userSubscription.findUnique({
        where: { token },
      });
      if (!sub) {
        res.status(404).json({ error: "Token not found" });
        return;
      }
      await prisma.userSubscription.update({
        where: { id: sub.id },
        data: { emailConfirmed: true },
      });
      res.status(200).json({ message: "Subscription confirmed successfully" });
    } catch (err) {
      next(err);
    }
  }

  static async unsubscribe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.params.token;
      if (!token) {
        res.status(400).json({ error: "Invalid token" });
        return;
      }
      const sub = await prisma.userSubscription.findUnique({
        where: { token },
      });
      if (!sub) {
        res.status(404).json({ error: "Token not found" });
        return;
      }
      await deleteSubscription(sub.id);
      unscheduleSubscription(sub.id);
      res.status(200).json({ message: "Unsubscribed successfully" });
    } catch (err) {
      next(err);
    }
  }
}
