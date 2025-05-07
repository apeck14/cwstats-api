import { Router } from 'express'

import playerController from '@/controllers/player/get-player'
import playerLimitedController from '@/controllers/player/get-player-limited'
import playerLogController from '@/controllers/player/get-player-log'
import playerAddController from '@/controllers/player/put-player'
import validation from '@/middleware/validation'
import { playerSchema } from '@/zod/supercell'

const router: Router = Router()

router.put('/', playerAddController)
router.get('/:tag', validation(playerSchema), playerController)
router.get('/:tag/limited', validation(playerSchema), playerLimitedController)
router.get('/:tag/log', validation(playerSchema), playerLogController)

// Export router with all routes
export default router
