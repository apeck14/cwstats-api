# /clan Routes

## Intent

Provide clan data from Supercell API with optional enrichment and caching.

## Endpoints

| Method | Path                      | Purpose              |
| ------ | ------------------------- | -------------------- |
| GET    | `/clan/search`            | Search clans by name |
| GET    | `/clan/:tag`              | Full clan profile    |
| GET    | `/clan/:tag/limited`      | Minimal clan data    |
| GET    | `/clan/:tag/race`         | Current river race   |
| GET    | `/clan/:tag/race/limited` | Minimal race data    |
| GET    | `/clan/:tag/log`          | Historical race log  |

## Invariants

1. **Tag Validation**: All `:tag` routes validate via `clanSchema`
2. **Supercell Proxy**: Data fetched from Supercell API
3. **Error Mapping**: Supercell errors translated to user-friendly messages

## Request Format

```
GET /clan/ABC123
Authorization: Bearer <token>
```

Tag should NOT include `#` prefix.

## Response Format

```json
{
  "data": {
    /* clan object */
  },
  "status": 200
}
```

## Extension Points

- Add clan comparison endpoint
- Add cached clan history
