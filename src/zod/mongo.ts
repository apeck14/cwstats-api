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

export const guildCommandCooldownSchema = z.object({
  body: z.object({
    commandName: z
      .string({ message: 'commandName must be a string' })
      .min(1, { message: 'commandName cannot be empty' }),
    delay: z
      .number({ message: 'delay must be a number' })
      .min(0, { message: 'delay must be a non-negative number' }),
  }),
  params: z.object({
    id: guildIdSchema,
  }),
})
