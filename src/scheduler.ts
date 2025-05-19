import axios from "axios";
import { prisma } from "./prisma";
import { fetchWeather, saveWeatherRecord } from "./services/weather.service";
import { sendEmail } from "./services/email.service";
import { sseClients } from "./sse-clients";
import type { UserSubscription } from "@prisma/client";

interface SubscriptionJob {
  id: number;
  city: string;
  interval: number;
  webhookUrl?: string | null;
  email?: string | null;
}

const jobs: Record<number, { stop: () => void }> = {};

export async function startAllSchedulers() {
  const subs = await prisma.userSubscription.findMany();
  subs.forEach(scheduleNewSubscription);
}

export function stopAllSchedulers() {
  Object.keys(jobs).forEach((key) => {
    try {
      jobs[+key].stop();
    } catch (e) {
      console.error(`Error stopping job ${key}:`, e);
    }
    delete jobs[+key];
  });
}

export function unscheduleSubscription(id: number) {
  if (jobs[id]) {
    try {
      jobs[id].stop();
      console.info(`🗑️ Unscheduled job ${id}`);
    } catch (e) {
      console.error(`Error unscheduling job ${id}:`, e);
    }
    delete jobs[id];
  }
}

function startSchedulerFor(job: SubscriptionJob) {
  if (jobs[job.id]) {
    jobs[job.id].stop();
    delete jobs[job.id];
  }

  const runJob = async () => {
    try {
      const weather = await fetchWeather(job.city);
      const record = await saveWeatherRecord(job.id, weather);
      console.info(`[Job ${job.id}] Saved weather for ${job.city}`);

      if (job.webhookUrl) {
        try {
          await axios.post(job.webhookUrl, record, { timeout: 5000 });
          console.info(`[Job ${job.id}] Webhook sent to ${job.webhookUrl}`);
        } catch (hookErr) {
          if (hookErr instanceof Error) {
            console.error(`[Job ${job.id}] Webhook failed:`, hookErr.message);
          } else {
            console.error(`[Job ${job.id}] Webhook failed:`, hookErr);
          }
        }
      }

      if (job.email) {
        try {
          if (typeof record.data === "object" && record.data !== null) {
            const { temp, humidity, description } = record.data as Record<
              string,
              unknown
            >;
            const emailContent =
              temp && humidity && description
                ? `Temperature: ${temp}\nHumidity: ${humidity}\nDescription: ${description}`
                : "Weather data is unavailable at the moment.";

            await sendEmail(
              job.email,
              `Weather update for ${job.city}`,
              emailContent
            );
          } else {
            await sendEmail(
              job.email,
              `Weather update for ${job.city}`,
              "Weather data is unavailable at the moment."
            );
          }
        } catch (mailErr) {
          if (mailErr instanceof Error) {
            console.error(`[Job ${job.id}] Email failed:`, mailErr.message);
          } else {
            console.error(`[Job ${job.id}] Email failed:`, mailErr);
          }
        }
      }

      const clients = sseClients[job.id] || new Set();
      for (const res of clients) {
        try {
          res.write(`data: ${JSON.stringify(record)}\n\n`);
        } catch (sseErr) {
          console.error(`[Job ${job.id}] SSE failed:`, sseErr);
        }
      }
    } catch (err) {
      console.error(`[Job ${job.id}] Unexpected error:`, err);
    }
  };

  runJob();
  const handle = setInterval(runJob, job.interval * 1000);
  jobs[job.id] = { stop: () => clearInterval(handle) };
}

export function scheduleNewSubscription(sub: UserSubscription) {
  startSchedulerFor({
    id: sub.id,
    city: sub.city,
    interval: sub.interval,
    webhookUrl: sub.webhookUrl,
    email: sub.emailConfirmed ? sub.email : null,
  });
}
