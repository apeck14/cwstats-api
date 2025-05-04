import { Router } from 'express'

import clanController from '../controllers/get-clan'
import clanLimitedController from '../controllers/get-clan-limited'
import clanRaceController from '../controllers/get-clan-race'
import clanSearchController from '../controllers/get-clan-search'
import validation from '../middleware/validation'
import { clanSchema } from '../schemas/supercell'

const router: Router = Router()

router.get('/search', clanSearchController)
router.get('/:tag', validation(clanSchema), clanController)
router.get('/:tag/limited', validation(clanSchema), clanLimitedController)
router.get('/:tag/race', validation(clanSchema), clanRaceController)

// Export router with all routes
export default router
