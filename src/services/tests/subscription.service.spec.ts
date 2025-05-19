import { randomBytes } from "crypto";
import { prisma } from "../../prisma";
import {
  createSubscription,
  getSubscriptionById,
  deleteSubscription,
} from "../../services/subscription.service";

jest.mock("crypto", () => ({
  randomBytes: jest.fn(),
}));
jest.mock("../../prisma", () => ({
  prisma: {
    userSubscription: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("Subscription Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSubscription", () => {
    const baseData = { city: "Kyiv", interval: 30 };

    it("creates a new email subscription when none exists", async () => {
      (prisma.userSubscription.findFirst as jest.Mock).mockResolvedValue(null);
      (randomBytes as jest.Mock).mockReturnValue(Buffer.from("aabb"));
      (prisma.userSubscription.create as jest.Mock).mockResolvedValue({
        id: 1,
        email: "test@example.com",
        webhookUrl: null,
        sseToken: "deadbeef",
        token: "61616262",
        city: "Kyiv",
        interval: 30,
        emailConfirmed: false,
      });

      const result = await createSubscription({
        ...baseData,
        email: "test@example.com",
      });

      expect(prisma.userSubscription.findFirst).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(randomBytes).toHaveBeenCalledWith(16);
      expect(prisma.userSubscription.create).toHaveBeenCalledWith({
        data: {
          ...baseData,
          email: "test@example.com",
          webhookUrl: undefined,
          sseToken: "61616262",
          token: "61616262",
          emailConfirmed: false,
        },
      });
      expect(result).toMatchObject({ id: 1, email: "test@example.com" });
    });

    it("throws 409 if email already subscribed", async () => {
      (prisma.userSubscription.findFirst as jest.Mock).mockResolvedValue({
        id: 2,
        email: "dup@example.com",
      });

      await expect(
        createSubscription({ ...baseData, email: "dup@example.com" })
      ).rejects.toMatchObject({
        message: "Email already subscribed",
        status: 409,
      });

      expect(prisma.userSubscription.create).not.toHaveBeenCalled();
    });

    it("creates SSE-only subscription (no email)", async () => {
      (randomBytes as jest.Mock).mockReturnValue(Buffer.from("1234"));
      (prisma.userSubscription.create as jest.Mock).mockResolvedValue({
        id: 3,
        email: undefined,
        webhookUrl: null,
        sseToken: "31323334",
        token: null,
        city: "Kyiv",
        interval: 30,
        emailConfirmed: true,
      });

      const result = await createSubscription({
        ...baseData,
        webhookUrl: "https://hook/",
      });

      expect(prisma.userSubscription.findFirst).not.toHaveBeenCalled();
      expect(randomBytes).toHaveBeenCalledTimes(1);
      expect(prisma.userSubscription.create).toHaveBeenCalledWith({
        data: {
          ...baseData,
          email: undefined,
          webhookUrl: "https://hook/",
          sseToken: "31323334",
          token: null,
          emailConfirmed: true,
        },
      });
      expect(result).toHaveProperty("sseToken", "31323334");
    });
  });

  describe("getSubscriptionById", () => {
    it("returns the subscription record", async () => {
      (prisma.userSubscription.findUnique as jest.Mock).mockResolvedValue({
        id: 10,
        city: "Lviv",
        interval: 15,
      });
      const sub = await getSubscriptionById(10);
      expect(prisma.userSubscription.findUnique).toHaveBeenCalledWith({
        where: { id: 10 },
      });
      expect(sub).toEqual({ id: 10, city: "Lviv", interval: 15 });
    });
  });

  describe("deleteSubscription", () => {
    it("deletes the subscription record", async () => {
      (prisma.userSubscription.delete as jest.Mock).mockResolvedValue({
        id: 42,
      });
      const deleted = await deleteSubscription(42);
      expect(prisma.userSubscription.delete).toHaveBeenCalledWith({
        where: { id: 42 },
      });
      expect(deleted).toEqual({ id: 42 });
    });
  });
});
