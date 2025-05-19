# Weather Subscription API

A Node.js/TypeScript REST API for subscribing to weather updates for a specific city, with support for email notifications, webhooks, and Server-Sent Events (SSE). Built with Express and Prisma (PostgreSQL).

## Features

- **Weather Subscription**: Users can subscribe to periodic weather updates for a city.
- **Email Confirmation**: Email-based subscriptions require confirmation via a unique link.
- **Flexible Delivery**: Receive updates via email, webhook, or SSE.
- **Weather Data**: Fetches current weather from an external API.
- **Persistence**: All subscriptions and weather records are stored in PostgreSQL.
- **Scheduler**: Periodically fetches and delivers weather updates based on user preferences.
- **Health Check**: Simple endpoint to verify API status.

> **Note:** SSE (Server-Sent Events) and webhook delivery were implemented as side functionalities for the sake of curiosity and to explore real-time and push-based integrations.

## API Routes

### Subscription

- `POST /subscribe`

  - Body: `{ email?: string, webhookUrl?: string, sseToken?: string, city: string, frequency: "hourly" | "daily" }`
  - Description: Create a new subscription. At least one of `email`, `webhookUrl`, or `sseToken` must be provided.
  - Response: Subscription details and tokens.

- `GET /subscribe`

  - Query: `?token=...&sseToken=...`
  - Description: Opens an SSE stream for real-time weather updates (requires confirmed email subscription).

- `GET /confirm/:token`

  - Description: Confirms an email subscription using the provided token.

- `GET /unsubscribe/:token`
  - Description: Unsubscribes and deletes the subscription associated with the token.

### Weather

- `GET /weather?city=CityName`
  - Description: Returns the current weather for the specified city.

### Health

- `GET /health`
  - Description: Returns `{ status: "ok" }` if the API is running.

## Functionality Overview

- **Subscription Creation**: Validates input, prevents duplicate email subscriptions, and generates unique tokens.
- **Email Confirmation**: Sends a confirmation link to the user's email; only confirmed emails receive updates.
- **Scheduler**: Runs jobs for each subscription, fetching weather data and delivering it via the chosen method(s).
- **Webhooks**: If a webhook URL is provided, weather updates are POSTed to it.
- **SSE**: Real-time updates are pushed to connected clients via SSE.
- **Email**: Weather updates are sent to confirmed email addresses.

## Environment Variables

See `.env.example` for required configuration (database, weather API, SMTP, etc.).

## Running Locally

1. Install dependencies: `npm install`
2. Set up PostgreSQL (see `docker-compose.yml` for example).
3. Configure `.env` file.
4. Run migrations: `npx prisma migrate dev`
5. Start the server: `npm run dev`

## Testing Functionality

- **Webhooks**: You can use [Webhook.site](https://webhook.site/) or similar services to test webhook delivery by providing the generated URL as your `webhookUrl` during subscription.
- **SSE**: To test SSE, use the following command:

  ```sh
  curl -N "http://localhost:3000/subscribe?token=YOUR_TOKEN&sseToken=YOUR_SSE_TOKEN"
  ```

  Replace `YOUR_TOKEN` and `YOUR_SSE_TOKEN` with the values returned from the subscription response.

---

Let me know if you want to include usage examples or further technical details!
