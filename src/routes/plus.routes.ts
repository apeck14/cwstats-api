import { Router } from 'express'

import deleteDailyTrackingEntriesController from '@/controllers/plus/delete-daily-tracking-entries'
import plusClansController from '@/controllers/plus/get-plus-clans'

const router: Router = Router()

router.get('/clans', plusClansController)
router.delete('/daily-tracking/entries', deleteDailyTrackingEntriesController)

// Export router with all routes
export default router
