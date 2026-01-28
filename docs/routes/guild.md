# /guild Routes

## Intent

Manage Discord server configurations, linked clans, and nudge settings.

## Endpoints

| Method | Path                          | Purpose                            |
| ------ | ----------------------------- | ---------------------------------- |
| GET    | `/guild/clans`                | All linked clans across all guilds |
| GET    | `/guild/:id`                  | Full guild settings                |
| GET    | `/guild/:id/limited`          | Minimal guild data                 |
| GET    | `/guild/:id/clans`            | Clans linked to this guild         |
| POST   | `/guild/guilds`               | Batch create/update guilds         |
| POST   | `/guild/:id`                  | Create or update guild             |
| DELETE | `/guild/:id`                  | Delete guild record                |
| DELETE | `/guild/nudge`                | Delete nudge configuration         |
| DELETE | `/guild/:id/nudge-link/:tag`  | Remove nudge link for clan         |
| PATCH  | `/guild/:id/command-cooldown` | Update command cooldown            |
| PATCH  | `/guild/:id/user-nickname`    | Update user nickname setting       |
| PATCH  | `/guild/:id/timezone`         | Update guild timezone              |
| PUT    | `/guild/:id/nudge-link`       | Add nudge link for clan            |

## Invariants

1. **Guild Scoping**: All `:id` routes scoped to specific Discord guild
2. **Upsert Pattern**: POST creates or updates based on existence
3. **Cascade Awareness**: Deleting guild may orphan linked data

## Request Format

```
GET /guild/123456789
Authorization: Bearer <token>
```

## Response Format

```json
{
  "data": {
    "guildID": "123456789",
    "defaultClan": { "tag": "#ABC123", "name": "My Clan" },
    "abbreviations": [...],
    "nudges": {...}
  },
  "status": 200
}
```

## Extension Points

- Add guild analytics
- Add audit log for changes
