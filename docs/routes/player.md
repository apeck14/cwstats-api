# /player Routes

## Intent

Provide player data and manage player-account linking.

## Endpoints

| Method | Path                   | Purpose                     |
| ------ | ---------------------- | --------------------------- |
| GET    | `/player/search`       | Search players by name      |
| GET    | `/player/:tag`         | Full player profile         |
| GET    | `/player/:tag/limited` | Minimal player data         |
| GET    | `/player/:tag/log`     | Player battle log           |
| GET    | `/player/:tag/scores`  | Player war scores history   |
| PUT    | `/player`              | Add player to search index  |
| PUT    | `/player/link`         | Link player to Discord user |

## Invariants

1. **Tag Validation**: All `:tag` routes validate via `playerSchema`
2. **Search Index**: `PUT /player` adds to searchable player list
3. **Linking**: `PUT /player/link` associates tag with Discord user ID

## Request Format

```
GET /player/ABC123
Authorization: Bearer <token>
```

```
PUT /player/link
Authorization: Bearer <token>
Content-Type: application/json

{ "tag": "#ABC123", "userId": "123456789" }
```

## Response Format

```json
{
  "data": {
    /* player object */
  },
  "status": 200
}
```

## Extension Points

- Add player comparison endpoint
- Add deck analysis endpoint
