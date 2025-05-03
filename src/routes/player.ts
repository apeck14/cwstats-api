import { Router } from 'express'

import playerController from '../controllers/player.controller'
import playerLimitedController from '../controllers/player-limited.controller'
import validation from '../middleware/validation'
import { playerSchema } from '../schemas/zod/player'

const router: Router = Router()

router.get('/:tag', validation(playerSchema), playerController)
router.get('/limited/:tag', validation(playerSchema), playerLimitedController)

// Export router with all routes
export default router
