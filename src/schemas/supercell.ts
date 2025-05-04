import { z } from 'zod'

import { tagSchema } from './utils'

export const playerSchema = z.object({
  params: z.object({
    tag: tagSchema,
  }),
})

export const clanSchema = z.object({
  params: z.object({
    tag: tagSchema,
  }),
})

export const searchSchema = z.object({
  query: z.object({
    name: z.string().min(1, { message: 'name cannot be empty' }),
  }),
})

export const leaderboardWarSchema = z.object({
  params: z.object({
    locationId: z.union([z.literal('global'), z.string().regex(/^\d+$/).transform(Number)]),
  }),
  query: z.object({
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .refine((val) => val > 0, {
        message: 'limit must be greater than 0',
      })
      .optional(),
  }),
})
