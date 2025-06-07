import { Router } from 'express'

import deleteDailyTrackingEntriesController from '@/controllers/plus/delete-daily-tracking-entries'
import plusClansController from '@/controllers/plus/get-plus-clans'
import postAddDailyTrackingEntries from '@/controllers/plus/post-daily-tracking-entries'

const router: Router = Router()

router.get('/clans', plusClansController)
router.delete('/daily-tracking/entries', deleteDailyTrackingEntriesController)
router.post('/daily-tracking/entries', postAddDailyTrackingEntries)

// Export router with all routes
export default router
