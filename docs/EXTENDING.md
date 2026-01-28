# Extending CWStats API

## Adding a New Endpoint

### 1. Create the Controller

Create in `/src/controllers/{domain}/`:

```typescript
// src/controllers/my-domain/get-something.ts
import { Request, Response } from 'express'

const getSomethingController = async (req: Request, res: Response) => {
  const { id } = req.params

  // Call service
  const result = await myService.getSomething(id)

  if (!result) {
    res.status(404).json({ error: 'Not found', status: 404 })
    return
  }

  res.status(200).json({ data: result, status: 200 })
}

export default getSomethingController
```

### 2. Add Validation Schema (if needed)

Create or extend in `/src/schemas/`:

```typescript
// src/schemas/my-domain.ts
import { z } from 'zod'

export const getSomethingSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
})
```

### 3. Create or Update the Route

Create in `/src/routes/` or add to existing:

```typescript
// src/routes/my-domain.routes.ts
import { Router } from 'express'
import getSomethingController from '@/controllers/my-domain/get-something'
import validation from '@/middleware/validation'
import { getSomethingSchema } from '@/schemas/my-domain'

const router: Router = Router()

router.get('/:id', validation(getSomethingSchema), getSomethingController)

export default router
```

### 4. Register the Route

Add to `/src/app.ts`:

```typescript
import myDomainRouter from '@/routes/my-domain.routes'

// In the routes section:
app.use('/my-domain', myDomainRouter)
```

## Adding a Service Function

Add to existing service or create new in `/src/services/`:

```typescript
// src/services/my-service.ts
export const getSomething = async (id: string) => {
  // Database query or external API call
  return result
}
```

## Adding a MongoDB Model

Create in `/src/models/`:

```typescript
// src/models/my-thing.model.ts
import mongoose, { Document, Schema } from 'mongoose'

export interface IMyThing extends Document {
  name: string
  createdAt: Date
}

const myThingSchema = new Schema<IMyThing>({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model<IMyThing>('MyThing', myThingSchema)
```

## Adding Types

Create in `/src/types/`:

```typescript
// src/types/my-domain.ts
export interface MyThing {
  id: string
  name: string
}
```

## Validation Middleware

The `validation` middleware accepts Zod schemas and validates:

- `params` - URL parameters
- `query` - Query string
- `body` - Request body

```typescript
const schema = z.object({
  params: z.object({ id: z.string() }),
  query: z.object({ limit: z.coerce.number().optional() }),
  body: z.object({ name: z.string() })
})
```

## Testing

Add tests in `/src/__tests__/`:

```typescript
// src/__tests__/routes/my-domain.test.ts
import request from 'supertest'
import app from '@/app'

describe('GET /my-domain/:id', () => {
  it('returns data for valid id', async () => {
    const res = await request(app).get('/my-domain/123').set('Authorization', `Bearer ${process.env.INTERNAL_API_KEY}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toBeDefined()
  })
})
```

## Checklist for New Endpoints

- [ ] Controller in `/controllers/{domain}/`
- [ ] Zod schema for validation
- [ ] Route registered with validation middleware
- [ ] Route mounted in `app.ts`
- [ ] Types defined in `/types/`
- [ ] Service functions for business logic
- [ ] Returns `{ data, status }` or `{ error, status }`
- [ ] Tests added
- [ ] Added documentation in `/docs/routes/`
