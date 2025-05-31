import { Router } from 'express'

import clanController from '@/controllers/clan/get-clan'
import clanLimitedController from '@/controllers/clan/get-clan-limited'
import clanRaceController from '@/controllers/clan/get-clan-race'
import clanRaceLimitedController from '@/controllers/clan/get-clan-race-limited'
import getClanRaceLogController from '@/controllers/clan/get-clan-race-log'
import clanSearchController from '@/controllers/clan/get-clan-search'
import validation from '@/middleware/validation'
import { clanSchema } from '@/schemas/supercell'

const router: Router = Router()

router.get('/search', clanSearchController)
router.get('/:tag', validation(clanSchema), clanController)
router.get('/:tag/limited', validation(clanSchema), clanLimitedController)
router.get('/:tag/race', validation(clanSchema), clanRaceController)
router.get('/:tag/race/limited', validation(clanSchema), clanRaceLimitedController)
router.get('/:tag/log', validation(clanSchema), getClanRaceLogController)

// Export router with all routes
export default router
