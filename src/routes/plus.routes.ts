import { Router } from 'express'

import deleteDailyTrackingEntriesController from '@/controllers/plus/delete-daily-tracking-entries'
import deletePlusClanController from '@/controllers/plus/delete-plus-clan'
import plusClansController from '@/controllers/plus/get-plus-clans'
import postAddDailyTrackingEntries from '@/controllers/plus/post-daily-tracking-entries'
import postAddHourlyTrackingEntries from '@/controllers/plus/post-hourly-tracking-entries'
import validation from '@/middleware/validation'
import { deletePlusClanSchema } from '@/schemas/mongo'

const router: Router = Router()

router.get('/clans', plusClansController)

router.post('/daily-tracking/entries', postAddDailyTrackingEntries)
router.post('/hourly-tracking/entries', postAddHourlyTrackingEntries)

router.delete('/daily-tracking/entries', deleteDailyTrackingEntriesController)
router.delete('/clan/:tag', validation(deletePlusClanSchema), deletePlusClanController)

// Export router with all routes
export default router
