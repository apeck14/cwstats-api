import { Router } from 'express'

import getProStatusController from '@/controllers/pro/get-status'
import getProSubscriptionController from '@/controllers/pro/get-subscription'
import patchProClanLogController from '@/controllers/pro/patch-clan-logs'
import patchProWarLogController from '@/controllers/pro/patch-war-logs'
import postProCheckoutController from '@/controllers/pro/post-checkout'
import postProPortalController from '@/controllers/pro/post-portal'

const router: Router = Router()

router.get('/status', getProStatusController)
router.get('/subscription', getProSubscriptionController)

router.post('/checkout', postProCheckoutController)
router.post('/portal', postProPortalController)

router.patch('/war-logs', patchProWarLogController)
router.patch('/clan-logs', patchProClanLogController)

// Export router with all routes
export default router
