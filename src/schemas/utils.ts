import { z } from 'zod'

export const tagSchema = z
  .string({
    invalid_type_error: 'tag must be a string',
    required_error: 'tag is required',
  })
  .nonempty({ message: 'tag is required' })
  .regex(/^[a-zA-Z0-9]+$/, { message: 'tag must be alphanumeric' })
  .min(3, { message: 'tag must be at least 3 characters long' })

export const guildIdSchema = z
  .string({
    invalid_type_error: 'id must be a string',
    required_error: 'id is required',
  })
  .nonempty({ message: 'id is required' })
  .regex(/^\d{17,19}$/, { message: 'id must be a valid Discord ID (17–19 digits)' })
