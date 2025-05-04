import { Router } from 'express'

import clanController from '../controllers/clan.controller'
import clanLimitedController from '../controllers/clan-limited.controller'
import clanRaceController from '../controllers/clan-race.controller'
import clanSearchController from '../controllers/clan-search.controller'
import validation from '../middleware/validation'
import { clanSchema } from '../schemas/supercell'

const router: Router = Router()

router.get('/search', clanSearchController)
router.get('/:tag', validation(clanSchema), clanController)
router.get('/:tag/limited', validation(clanSchema), clanLimitedController)
router.get('/:tag/race', validation(clanSchema), clanRaceController)

// Export router with all routes
export default router
