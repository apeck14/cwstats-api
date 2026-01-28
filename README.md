# CWStats API

RESTful API backend for the CWStats platform. Provides endpoints for Clash Royale data, user management, subscriptions, and Discord integrations.

## Quick Reference

| Route            | Purpose                                  |
| ---------------- | ---------------------------------------- |
| `/player/*`      | Player profiles, battle logs, linking    |
| `/clan/*`        | Clan data, race stats, race logs         |
| `/leaderboard/*` | War and daily leaderboards               |
| `/guild/*`       | Discord server settings and linked clans |
| `/user/*`        | User accounts and preferences            |
| `/plus/*`        | Plus tier features and tracking          |
| `/pro/*`         | Pro subscriptions and Stripe integration |
| `/emoji/*`       | Clan badge emoji management              |
| `/linked-clan/*` | Clan linking operations                  |
| `/war-logs/*`    | War log data for Pro clans               |
| `/clan-logs/*`   | Clan activity logs for Pro clans         |

## Architecture Overview

```
src/
├── server.ts           # Entry point, DB connection
├── app.ts              # Express app, middleware, routes
├── config/             # Database configuration
├── controllers/        # Request handlers (by domain)
├── middleware/         # Auth, validation, logging, errors
├── models/             # Mongoose schemas
├── routes/             # Route definitions
├── schemas/            # Zod validation schemas
├── services/           # External API clients
│   ├── supercell.ts    # Clash Royale API
│   ├── mongo.ts        # MongoDB operations
│   ├── discord.ts      # Discord API
│   └── stripe.ts       # Stripe API
├── lib/                # Utilities
├── static/             # Constants
└── types/              # TypeScript definitions
```

## Documentation Structure

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System design and invariants
- [docs/EXTENDING.md](./docs/EXTENDING.md) - How to add new endpoints
- [docs/routes/](./docs/routes/) - Individual route documentation

---

_This documentation is designed for both human developers and AI agents. Each section uses consistent structure for automated parsing._
