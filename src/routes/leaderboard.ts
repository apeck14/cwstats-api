import { Router } from 'express'

import leaderboardWarController from '../controllers/leaderboard-war.controller'

const router: Router = Router()

router.get('/:locationId/war', leaderboardWarController)

// Export router with all routes
export default router
