import { Router } from "express";
import { SubscriptionController } from "../controllers/subscription.controller";
import { validateSubscriptionDto } from "../middlewares/validate.dto";

const router = Router();

router.post(
  "/subscribe",
  validateSubscriptionDto,
  SubscriptionController.create
);

router.get("/subscribe", SubscriptionController.stream);

router.get("/confirm/:token", SubscriptionController.confirm);

router.get("/unsubscribe/:token", SubscriptionController.unsubscribe);

export default router;
