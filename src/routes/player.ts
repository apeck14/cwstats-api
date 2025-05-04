import { Router } from 'express'

import playerController from '../controllers/get-player'
import playerLimitedController from '../controllers/get-player-limited'
import playerLogController from '../controllers/get-player-log'
import playerAddController from '../controllers/put-player'
import validation from '../middleware/validation'
import { playerSchema } from '../schemas/supercell'

const router: Router = Router()

router.put('/', playerAddController)
router.get('/:tag', validation(playerSchema), playerController)
router.get('/:tag/limited', validation(playerSchema), playerLimitedController)
router.get('/:tag/log', validation(playerSchema), playerLogController)

// Export router with all routes
export default router
