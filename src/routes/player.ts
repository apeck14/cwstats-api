import { Router } from 'express'

import playerController from '../controllers/player.controller'
import playerLimitedController from '../controllers/player-limited.controller'
import playerLogController from '../controllers/player-log.controller'
import validation from '../middleware/validation'
import { playerSchema } from '../schemas/zod/supercell'

const router: Router = Router()

router.get('/:tag', validation(playerSchema), playerController)
router.get('/:tag/limited', validation(playerSchema), playerLimitedController)
router.get('/:tag/log', validation(playerSchema), playerLogController)

// Export router with all routes
export default router
