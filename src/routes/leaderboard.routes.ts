import { Router } from 'express'

import leaderboardDailyController from '@/controllers/leaderboard/get-leaderboard-daily'
import leaderboardWarController from '@/controllers/leaderboard/get-leaderboard-war'
import patchLeaderboardTimestampController from '@/controllers/leaderboard/patch-leaderboard-timestamp'
import patchLeaderboardTrainingDaysController from '@/controllers/leaderboard/patch-leaderboard-training-days'
import postUpdateDailyLeaderboardController from '@/controllers/leaderboard/post-update-daily-leaderboard'

const router: Router = Router()

router.get('/daily', leaderboardDailyController)
router.get('/:locationId/war', leaderboardWarController)

router.post('/daily/update', postUpdateDailyLeaderboardController)

router.patch('/timestamp', patchLeaderboardTimestampController)
router.patch('/training-days', patchLeaderboardTrainingDaysController)

// Export router with all routes
export default router
