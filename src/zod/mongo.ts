import { z } from 'zod'

import { tagSchema } from './utils'

export const playerDocumentSchema = z.object({
  tag: tagSchema,
})
