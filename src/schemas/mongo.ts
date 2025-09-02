import { z } from 'zod'

import { discordIdSchema, locationSchema, riserFallerEntrySchema, tagSchema } from '@/schemas/utils'

export const playerDocumentSchema = z.object({
  tag: tagSchema,
})

export const playerLinkSchema = z.object({
  tag: tagSchema,
  userId: discordIdSchema,
})

export const plusClansSchema = z.object({
  query: z.object({
    hideDailyTracking: z
      .enum(['true', 'false'], { message: "hideDailyTracking must be 'true' or 'false'" })
      .optional()
      .default('false'),
    hideHourlyAverages: z
      .enum(['true', 'false'], { message: "hideHourlyAverages must be 'true' or 'false'" })
      .optional()
      .default('false'),
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

export const guildsSchema = z.object({
  body: z.object({
    query: z.object({}).passthrough(),
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

export const putGuildNudgeLinkSchema = z.object({
  body: z.object({
    tag: tagSchema,
    userId: discordIdSchema,
  }),
  params: z.object({
    id: discordIdSchema,
  }),
})

export const deleteGuildNudgeLinkSchema = z.object({
  params: z.object({
    id: discordIdSchema,
    tag: tagSchema,
  }),
})

export const deleteGuildNudgeSchema = z.object({
  body: z.object({
    guildId: discordIdSchema,
    scheduledHourUTC: z.number(),
    tag: tagSchema,
  }),
})

export const emojiBulkAddSchema = z.object({
  body: z.object({
    emojis: z
      .array(
        z.object({
          emoji: z.string(),
          name: z.string(),
        }),
        { required_error: 'emojis must be an array of objects' },
      )
      .min(1, { message: 'emojis array cannot be empty' }),
  }),
})

export const getEmojiSchema = z.object({
  params: z.object({
    name: z.string({ message: 'name must be a string' }).min(1, { message: 'name cannot be empty' }),
  }),
})

export const deleteDailyTrackingEntriesSchema = z.object({
  body: z.object({
    entries: z
      .array(
        z.object({
          season: z.number(),
          timestamp: z.string(),
        }),
        { required_error: 'entries must be an array of objects' },
      )
      .min(1, { message: 'entries array cannot be empty' }),
    tag: tagSchema,
  }),
})

export const addDailyTrackingEntriesSchema = z.object({
  body: z.object({
    entries: z
      .array(
        z.object({
          day: z.number(),
          scores: z.array(
            z.object({
              attacks: z.number(),
              fame: z.number(),
              missed: z.boolean(),
              name: z.string(),
              notInClan: z.boolean().optional(),
              tag: z.string(),
            }),
          ),
          season: z.number(),
          tag: tagSchema,
          timestamp: z.string(),
          week: z.number(),
        }),
        { required_error: 'entries must be an array of objects' },
      )
      .min(1, { message: 'entries array cannot be empty' }),
  }),
})

export const addHourlyTrackingEntriesSchema = z.object({
  body: z.object({
    entries: z
      .array(
        z.object({
          attacksCompleted: z.number(),
          avg: z.number(),
          day: z.number(),
          lastHourAvg: z.number(),
          season: z.number(),
          tag: z.string(),
          timestamp: z.string(),
          week: z.number(),
        }),
        { required_error: 'entries must be an array of objects' },
      )
      .min(1, { message: 'entries array cannot be empty' }),
  }),
})

export const updateDailyLeaderboardSchema = z.object({
  body: z.object({
    entries: z
      .array(
        z.object({
          badge: z.string(),
          badgeId: z.number(),
          boatPoints: z.number(),
          clanScore: z.number(),
          crossedFinishLine: z.boolean(),
          decksRemaining: z.number(),
          fameAvg: z.number(),
          isTraining: z.boolean(),
          location: locationSchema,
          name: z.string(),
          notRanked: z.boolean(),
          projPlacement: z.number().nullable(),
          rank: z.number().nullable(),
          tag: z.string(),
        }),
        { required_error: 'entries must be an array of objects' },
      )
      .min(1, { message: 'entries array cannot be empty' }),
  }),
})

export const patchSeasonalReportSentSchema = z.object({
  body: z.object({
    reportSent: z.boolean(),
    tag: tagSchema,
  }),
})

export const patchRisersFallersSchema = z.object({
  body: z.object({
    fallers: z.array(riserFallerEntrySchema).min(1, { message: 'fallers array cannot be empty' }),
    risers: z.array(riserFallerEntrySchema).min(1, { message: 'risers array cannot be empty' }),
  }),
})

export const deletePlusClanSchema = z.object({
  params: z.object({
    tag: tagSchema,
  }),
})

export const getPlayerSearchSchema = z.object({
  query: z.object({
    limit: z.string().optional(),
    name: z.string().min(1, { message: 'name cannot be empty' }),
  }),
})

export const putWarLogClanAttacksSchema = z.object({
  body: z.object({
    attacks: z.record(z.number().int()),
    dayIndex: z.number(),
    tag: tagSchema,
  }),
})

export const postWarLogsBulkAddSchema = z.object({
  body: z.object({
    entries: z
      .array(
        z.object({
          battleTime: z.string(),
          tag: z.string(),
        }),
        { required_error: 'entries must be an array of objects' },
      )
      .min(1, { message: 'entries array cannot be empty' }),
  }),
})

export const getWarLogSchema = z.object({
  params: z.object({
    key: z.string().endsWith('.000Z'),
  }),
})

export const postBulkUpdateWarLogClanAttacksSchema = z.object({
  body: z.object({
    entries: z
      .array(
        z.object({
          attacks: z.record(z.number().int()),
          dayIndex: z.number(),
          tag: z.string(),
        }),
        { required_error: 'entries must be an array of objects' },
      )
      .min(1, { message: 'entries array cannot be empty' }),
  }),
})

export const postWarLogsBulkUpdateLastUpdatedSchema = z.object({
  body: z.object({
    entries: z
      .array(
        z.object({
          tag: z.string(),
          timestamp: z.number(),
        }),
        { required_error: 'entries must be an array of objects' },
      )
      .min(1, { message: 'entries array cannot be empty' }),
  }),
})

export const postProCheckoutSchema = z.object({
  body: z.object({
    clanTag: tagSchema,
  }),
})

export const getProStatusSchema = z.object({
  body: z.object({
    clanTag: tagSchema,
  }),
})

export const patchProWarLogSchema = z.object({
  body: z.object({
    channelId: discordIdSchema.nullable(),
    guildId: discordIdSchema,
    tag: tagSchema,
  }),
})
