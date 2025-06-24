import { Router } from 'express'

import leaderboardDailyController from '@/controllers/leaderboard/get-leaderboard-daily'
import leaderboardWarController from '@/controllers/leaderboard/get-leaderboard-war'
import patchLeaderboardTimestampController from '@/controllers/leaderboard/patch-leaderboard-timestamp'

const router: Router = Router()

router.get('/daily', leaderboardDailyController)
router.get('/:locationId/war', leaderboardWarController)
router.patch('/timestamp', patchLeaderboardTimestampController)

// Export router with all routes
export default router
