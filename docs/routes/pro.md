# /pro Routes

## Intent

Handle Pro subscription management via Stripe integration.

## Endpoints

| Method | Path                     | Purpose                               |
| ------ | ------------------------ | ------------------------------------- |
| GET    | `/pro/checkout-redirect` | Redirect after Stripe checkout        |
| GET    | `/pro/status`            | Check Pro status for a clan           |
| GET    | `/pro/subscription`      | Get subscription details              |
| POST   | `/pro/checkout`          | Create Stripe checkout session        |
| POST   | `/pro/portal`            | Create Stripe customer portal session |
| POST   | `/pro/webhook`           | Stripe webhook handler                |
| PATCH  | `/pro/war-logs`          | Update war log settings               |
| PATCH  | `/pro/clan-logs`         | Update clan log settings              |

## Invariants

1. **Webhook Signature**: `/pro/webhook` verifies Stripe signature
2. **Idempotency**: Webhook events processed exactly once
3. **Raw Body**: Webhook route receives raw body (not JSON parsed)
4. **Metadata Required**: Checkout sessions must include clan metadata

## Webhook Events Handled

| Event                           | Action                             |
| ------------------------------- | ---------------------------------- |
| `customer.subscription.created` | Activate Pro, assign role, send DM |
| `customer.subscription.updated` | Update status                      |
| `customer.subscription.deleted` | Deactivate Pro, cleanup data       |
| `invoice.payment_succeeded`     | Confirm active status              |
| `invoice.payment_failed`        | Mark inactive, notify user         |

## Request Format

```
POST /pro/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "clanTag": "#ABC123",
  "clanName": "My Clan",
  "userId": "123456789"
}
```

## Extension Points

- Add subscription upgrade/downgrade
- Add usage-based billing
