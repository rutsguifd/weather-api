import { Request, Response, NextFunction } from "express";
import Joi from "joi";

const subscriptionSchema = Joi.object({
  email: Joi.string().email().optional(),
  webhookUrl: Joi.string().uri().optional(),
  sseToken: Joi.string().optional(),
  city: Joi.string().required().messages({
    "any.required": "city is required",
    "string.empty": "city cannot be empty",
  }),
  frequency: Joi.string().valid("hourly", "daily").required().messages({
    "any.only": "frequency must be either hourly or daily",
    "any.required": "frequency is required",
  }),
});

export function validateSubscriptionDto(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { error } = subscriptionSchema.validate(req.body);
  if (error) {
    // Respond with validation error message and do not call next()
    res.status(400).json({ error: error.details[0].message });
    return;
  }
  next();
}
