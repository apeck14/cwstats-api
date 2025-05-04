import { Router } from 'express'

import leaderboardWarController from '../controllers/get-leaderboard-war'

const router: Router = Router()

router.get('/:locationId/war', leaderboardWarController)

// Export router with all routes
export default router
