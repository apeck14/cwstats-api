# /leaderboard Routes

## Intent

Provide war trophy leaderboards from Supercell API and daily race leaderboards.

## Endpoints

| Method | Path                           | Purpose                            |
| ------ | ------------------------------ | ---------------------------------- |
| GET    | `/leaderboard/daily`           | Daily race leaderboard             |
| GET    | `/leaderboard/:locationId/war` | War trophy leaderboard by location |
| POST   | `/leaderboard/daily/update`    | Bulk update daily leaderboard      |
| PATCH  | `/leaderboard/timestamp`       | Update last refresh timestamp      |
| PATCH  | `/leaderboard/training-days`   | Reset for training days            |

## Invariants

1. **Location IDs**: War leaderboard requires valid Supercell location ID
2. **Global = 57000000**: Use this ID for global leaderboard
3. **Daily Updates**: Daily leaderboard updated by jobs service
4. **Training Reset**: Leaderboard resets during Tue/Wed training

## Request Format

```
GET /leaderboard/daily?limit=100&minTrophies=4000
Authorization: Bearer <token>
```

```
GET /leaderboard/57000000/war
Authorization: Bearer <token>
```

## Response Format

```json
{
  "data": [
    { "rank": 1, "tag": "#ABC123", "name": "Top Clan", "clanScore": 65000 },
    ...
  ],
  "status": 200
}
```

## Query Parameters (Daily)

| Param         | Type   | Description           |
| ------------- | ------ | --------------------- |
| `limit`       | number | Max results to return |
| `key`         | string | Region filter key     |
| `minTrophies` | number | Minimum trophy filter |
| `maxTrophies` | number | Maximum trophy filter |

## Extension Points

- Add historical leaderboard snapshots
- Add player leaderboards
