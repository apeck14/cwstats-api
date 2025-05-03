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

export const clanSearchSchema = z.object({
  query: z.object({
    name: z.string().min(1, { message: 'Name cannot be empty' }),
  }),
})
