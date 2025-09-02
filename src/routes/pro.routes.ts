import { Router } from 'express'

import getProStatusController from '@/controllers/pro/get-status'
import patchProWarLogController from '@/controllers/pro/patch-war-logs'
import postProCheckoutController from '@/controllers/pro/post-checkout'
import postProPortalController from '@/controllers/pro/post-portal'

const router: Router = Router()

router.get('/status', getProStatusController)

router.post('/checkout', postProCheckoutController)
router.post('/portal', postProPortalController)

router.patch('/war-logs', patchProWarLogController)

// Export router with all routes
export default router
