import { Router } from 'express'

import patchResetSeasonalReportsController from '@/controllers/linked-clan/patch-reset-season-reports'
import patchSeasonalReportSentController from '@/controllers/linked-clan/patch-season-report-sent'
import patchUnsetChannelController from '@/controllers/linked-clan/patch-unset-channel'

const router: Router = Router()

router.patch('/season-report-sent', patchSeasonalReportSentController)
router.patch('/reset-season-reports', patchResetSeasonalReportsController)
router.patch('/unset-channel', patchUnsetChannelController)

// Export router with all routes
export default router
