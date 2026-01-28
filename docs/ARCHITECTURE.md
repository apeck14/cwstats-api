# Architecture

## System Intent

CWStats API is an **Express.js REST API** that:

1. Proxies and caches Supercell Clash Royale API data
2. Manages user accounts, subscriptions, and preferences
3. Handles Discord server configurations
4. Processes Stripe webhooks for Pro subscriptions
5. Serves as the single data source for web, bot, and jobs

## Core Invariants

These rules must always hold true. Violating them will cause security issues or data corruption.

### 1. All Routes Require Authentication

> Every request must include a valid `Authorization: Bearer <token>` header.

The `verifyInternalToken` middleware blocks unauthenticated requests with 401/403. Only internal services (web, bot, jobs) should have the API key.

Exception: The `/pro/webhook` endpoint uses Stripe signature verification instead.

### 2. Controllers Are Thin

> Controllers handle HTTP concerns only; business logic lives in services.

Controllers should:

- Extract and validate request data
- Call service functions
- Format and send responses

Controllers should NOT:

- Contain business logic
- Make direct database calls
- Call external APIs directly

### 3. Validation Before Processing

> All route parameters and request bodies must be validated via Zod schemas.

Use the `validation` middleware with schemas from `/schemas/`. Invalid requests get 400 responses before reaching controllers.

### 4. Consistent Response Format

> All responses follow `{ data?, error?, status }` pattern.

Success responses include `data` and `status`. Error responses include `error` and `status`. This allows clients to handle all responses consistently.

### 5. Supercell API Error Mapping

> Supercell API errors must be translated to user-friendly messages.

| Supercell Status | Mapped Message                   |
| ---------------- | -------------------------------- |
| 404              | "Not found."                     |
| 429              | "Supercell rate limit exceeded." |
| 503              | "Supercell maintenance break."   |
| Other            | "Unexpected error."              |

### 6. Stripe Webhook Idempotency

> Webhook events must be processed exactly once.

The `webhook-event` model tracks processed event IDs. Duplicate events are acknowledged but skipped.

### 7. Raw Body for Stripe

> The `/pro/webhook` route must receive raw body for signature verification.

This route is registered before `json()` middleware with `raw({ type: 'application/json' })`.

## Data Flow

```
Client Request
     ↓
Middleware Stack:
  ├── helmet (security headers)
  ├── cors (origin validation)
  ├── requestLogger (Logtail)
  ├── verifyInternalToken (auth)
  └── validation (Zod schemas)
     ↓
Controller
     ↓
Service Layer
     ↓
External APIs / MongoDB
     ↓
Response sent
```

## Service Layer

| Service        | Purpose                             |
| -------------- | ----------------------------------- |
| `supercell.ts` | Clash Royale API proxy              |
| `mongo.ts`     | MongoDB CRUD operations             |
| `discord.ts`   | Discord API (webhooks, DMs, roles)  |
| `stripe.ts`    | Stripe API (subscriptions, portals) |

## Models (MongoDB Collections)

| Model               | Purpose                       |
| ------------------- | ----------------------------- |
| `accounts`          | User accounts (Discord OAuth) |
| `guild`             | Discord server settings       |
| `linked-clan`       | Clan-to-guild associations    |
| `linked-account`    | Player-to-user associations   |
| `plus-clan`         | Plus tier clan tracking       |
| `pro-clan`          | Pro subscription clans        |
| `player`            | Player search index           |
| `daily-leaderboard` | Cached leaderboard data       |
| `clan-log`          | Clan state snapshots          |
| `war-log`           | War attack records            |
| `emoji`             | Clan badge emoji cache        |
| `webhook-event`     | Stripe event idempotency      |

## Error Handling

| Error Type        | HTTP Status |
| ----------------- | ----------- |
| Missing auth      | 401         |
| Invalid auth      | 403         |
| Validation failed | 400         |
| Not found         | 404         |
| Rate limited      | 429         |
| Server error      | 500         |

The `errorHandler` middleware catches unhandled errors and returns 500 with generic message.

## Environment Modes

| Mode        | Supercell API       | CORS Origin    |
| ----------- | ------------------- | -------------- |
| development | RoyaleAPI proxy     | localhost:5000 |
| production  | api.clashroyale.com | cwstats.com    |
