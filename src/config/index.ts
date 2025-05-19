import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

const envSchema = Joi.object({
  PORT: Joi.number().default(3000),
  BASE_URL: Joi.string().uri().required(),
  DATABASE_URL: Joi.string().uri().required(),
  WEATHER_API_KEY: Joi.string().required(),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().required(),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  SMTP_FROM: Joi.string().required(),
}).unknown();

const { error, value: env } = envSchema.validate(process.env);
if (error) {
  console.error("Config validation error:", error.message);
  process.exit(1);
}

export const config = {
  port: env.PORT,
  baseUrl: env.BASE_URL,
  databaseUrl: env.DATABASE_URL,
  weatherApiKey: env.WEATHER_API_KEY,
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
  },
};
