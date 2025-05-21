import { Router } from 'express'

import leaderboardDailyController from '@/controllers/leaderboard/get-leaderboard-daily'
import leaderboardWarController from '@/controllers/leaderboard/get-leaderboard-war'

const router: Router = Router()

router.get('/daily', leaderboardDailyController)
router.get('/:locationId/war', leaderboardWarController)

// Export router with all routes
export default router
