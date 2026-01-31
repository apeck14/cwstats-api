# /plus Routes

## Intent

Manage Plus tier features including daily tracking and reports.

## Endpoints

| Method | Path                           | Purpose                      |
| ------ | ------------------------------ | ---------------------------- |
| GET    | `/plus/clans`                  | Get all Plus clans           |
| POST   | `/plus/daily-tracking/entries` | Add daily tracking entries   |
| POST   | `/plus/seasonal-report`        | Mark seasonal report sent    |
| POST   | `/plus/war-report`             | Send war report to channel   |
| DELETE | `/plus/daily-tracking/entries` | Remove tracking entries      |
| DELETE | `/plus/clan/:tag`              | Remove Plus status from clan |

## Invariants

1. **Tracking Data**: Daily entries appended, not replaced
2. **Report Flags**: Seasonal report flag prevents duplicate sends
3. **Plus Eligibility**: Clans gain Plus via Pro subscription or website URL

## Request Format

```
GET /plus/clans?tagsOnly=true
Authorization: Bearer <token>
```

```
POST /plus/daily-tracking/entries
Authorization: Bearer <token>
Content-Type: application/json

{
  "tag": "#ABC123",
  "entries": [...]
}
```

## Response Format

```json
{
  "data": [...],
  "status": 200
}
```

## Extension Points

- Add tracking data export
- Add custom report scheduling
