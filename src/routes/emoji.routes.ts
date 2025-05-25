import { Router } from 'express'

import postEmojiBulkAddController from '@/controllers/emoji/post-emoji-bulk-add'

const router: Router = Router()

router.post('/bulk-add', postEmojiBulkAddController)

// Export router with all routes
export default router
