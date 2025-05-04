import { Router } from 'express'

import getGuildClansController from '../controllers/get-guild-clans'
import validation from '../middleware/validation'
import { guildClansSchema } from '../zod/mongo'

const router: Router = Router()

router.get('/:id/clans', validation(guildClansSchema), getGuildClansController)

// Export router with all routes
export default router
