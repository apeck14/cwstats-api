import { z } from 'zod'

import { tagSchema } from './utils'

export const playerSchema = z.object({
  params: z.object({
    tag: tagSchema,
  }),
})
