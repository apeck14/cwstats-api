import { Router } from 'express'

import getEmojiController from '@/controllers/emoji/get-emoji'
import postEmojiBulkAddController from '@/controllers/emoji/post-emoji-bulk-add'
import validation from '@/middleware/validation'
import { getEmojiSchema } from '@/schemas/mongo'

const router: Router = Router()

router.get('/:name', validation(getEmojiSchema), getEmojiController)
router.post('/bulk-add', postEmojiBulkAddController)

// Export router with all routes
export default router
