import { z } from 'zod'

import { discordIdSchema, tagSchema } from '@/schemas/utils'

export const playerDocumentSchema = z.object({
  tag: tagSchema,
})

export const playerLinkSchema = z.object({
  tag: tagSchema,
  userId: discordIdSchema,
})

export const plusClansSchema = z.object({
  query: z.object({
    tagsOnly: z
      .enum(['true', 'false'], { message: "tagsOnly must be 'true' or 'false'" })
      .optional()
      .default('false'),
  }),
})

export const guildSchema = z.object({
  params: z.object({
    id: discordIdSchema,
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
    id: discordIdSchema,
  }),
})

export const guildUserNicknameSchema = z.object({
  body: z.object({
    nickname: z
      .string({ message: 'nickname must be a string' })
      .min(1, { message: 'nickname cannot be empty' }),
    userId: z.string({ message: 'userId must be a string' }).min(1, { message: 'userId cannot be empty' }),
  }),
  params: z.object({
    id: discordIdSchema,
  }),
})
