import { Router } from 'express'

import patchSeasonalReportSentController from '@/controllers/linked-clan/patch-season-report-sent'

const router: Router = Router()

router.patch('/season-report-sent', patchSeasonalReportSentController)

// Export router with all routes
export default router
