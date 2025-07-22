import { Router } from 'express'

import deleteDailyTrackingEntriesController from '@/controllers/plus/delete-daily-tracking-entries'
import deletePlusClanController from '@/controllers/plus/delete-plus-clan'
import plusClansController from '@/controllers/plus/get-plus-clans'
import getWarLogClansController from '@/controllers/plus/get-war-log-clans'
import patchFreeWarLogClanController from '@/controllers/plus/patch-free-war-log-clan'
import postAddDailyTrackingEntries from '@/controllers/plus/post-daily-tracking-entries'
import postAddHourlyTrackingEntries from '@/controllers/plus/post-hourly-tracking-entries'
import validation from '@/middleware/validation'
import { deletePlusClanSchema } from '@/schemas/mongo'

const router: Router = Router()

router.get('/clans', plusClansController)
router.get('/war-log-clans', getWarLogClansController)

router.post('/daily-tracking/entries', postAddDailyTrackingEntries)
router.post('/hourly-tracking/entries', postAddHourlyTrackingEntries)

router.patch('/free-war-log-clan', patchFreeWarLogClanController)

router.delete('/daily-tracking/entries', deleteDailyTrackingEntriesController)
router.delete('/clan/:tag', validation(deletePlusClanSchema), deletePlusClanController)

// Export router with all routes
export default router
