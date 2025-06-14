import { Router } from 'express'

import playerController from '@/controllers/player/get-player'
import playerLimitedController from '@/controllers/player/get-player-limited'
import playerLogController from '@/controllers/player/get-player-log'
import getPlayerScoresController from '@/controllers/player/get-player-scores'
import playerAddController from '@/controllers/player/put-player'
import playerLinkController from '@/controllers/player/put-player-link'
import validation from '@/middleware/validation'
import { playerSchema } from '@/schemas/supercell'

const router: Router = Router()

router.put('/', playerAddController)
router.put('/link', playerLinkController)
router.get('/:tag', validation(playerSchema), playerController)
router.get('/:tag/limited', validation(playerSchema), playerLimitedController)
router.get('/:tag/log', validation(playerSchema), playerLogController)
router.get('/:tag/scores', validation(playerSchema), getPlayerScoresController)

// Export router with all routes
export default router
