import { z } from 'zod'

export const playerDocumentSchema = z.object({
  tag: z.string().min(1, 'tag is required'),
})
