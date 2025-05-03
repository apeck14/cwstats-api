import { z } from 'zod'

export const tagSchema = z
  .string()
  .nonempty({ message: 'tag is required' })
  .regex(/^[a-zA-Z0-9]+$/, { message: 'tag must be alphanumeric' })
  .min(3, { message: 'tag must be at least 3 characters long' })
