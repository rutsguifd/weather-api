import { Router } from "express";
import { SubscriptionController } from "../controllers/subscription.controller";
import { validateSubscriptionDto } from "../middlewares/validate.dto";

const router = Router();

// Create a new subscription
router.post(
  "/subscribe",
  validateSubscriptionDto,
  SubscriptionController.create
);

// SSE endpoint: /subscribe?token=...&sseToken=...
router.get("/subscribe", SubscriptionController.stream);

// Confirm via email token
router.get("/confirm/:token", SubscriptionController.confirm);

// Unsubscribe via email token
router.get("/unsubscribe/:token", SubscriptionController.unsubscribe);

export default router;
