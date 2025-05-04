import { z } from 'zod'

import { guildIdSchema, tagSchema } from './utils'

export const playerDocumentSchema = z.object({
  tag: tagSchema,
})

export const plusClansSchema = z.object({
  query: z.object({
    tagsOnly: z
      .enum(['true', 'false'], { message: "tagsOnly must be 'true' or 'false'" })
      .optional()
      .default('false'),
  }),
})

export const guildClansSchema = z.object({
  params: z.object({
    id: guildIdSchema,
  }),
})
