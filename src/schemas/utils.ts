/* eslint-disable camelcase */
import { z } from 'zod'

export const tagSchema = z
  .string({
    invalid_type_error: 'tag must be a string',
    required_error: 'tag is required'
  })
  .nonempty({ message: 'tag is required' })
  .regex(/^[a-zA-Z0-9]+$/, { message: 'tag must be alphanumeric' })
  .min(3, { message: 'tag must be at least 3 characters long' })

// can be used for users, guilds, channels, etc
export const discordIdSchema = z
  .string({
    invalid_type_error: 'id must be a string',
    required_error: 'id is required'
  })
  .nonempty({ message: 'id is required' })
  .regex(/^\d{17,19}$/, { message: 'id must be a valid Discord ID (17–19 digits)' })

export const locationSchema = z.object({
  countryCode: z.string().optional(),
  id: z.number(),
  isCountry: z.boolean(),
  name: z.string()
})

export const riserFallerEntrySchema = z.object({
  badgeId: z.number(),
  clanScore: z.number(),
  location: locationSchema,
  members: z.number(),
  name: z.string(),
  previousRank: z.number(),
  rank: z.number(),
  tag: z.string()
})
