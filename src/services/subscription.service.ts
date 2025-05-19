import { randomBytes } from "crypto";
import { prisma } from "../prisma";

export async function createSubscription(data: {
  email?: string;
  webhookUrl?: string;
  sseToken?: string;
  city: string;
  interval: number;
}) {
  if (data.email) {
    const exists = await prisma.userSubscription.findFirst({
      where: { email: data.email },
    });
    if (exists) {
      const err: any = new Error("Email already subscribed");
      err.status = 409;
      throw err;
    }
  }

  const token = data.email ? randomBytes(16).toString("hex") : null;
  const sseToken = data.sseToken || randomBytes(16).toString("hex");

  return prisma.userSubscription.create({
    data: {
      ...data,
      token,
      emailConfirmed: data.email ? false : true,
      sseToken,
    },
  });
}

export async function getSubscriptionById(id: number) {
  return prisma.userSubscription.findUnique({ where: { id } });
}

export async function deleteSubscription(id: number) {
  return prisma.userSubscription.delete({ where: { id } });
}
