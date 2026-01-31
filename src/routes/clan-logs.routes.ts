import { Router } from 'express'

import getClanLogClansController from '@/controllers/clan-logs/get-clans'
import getClanLogsController from '@/controllers/clan-logs/get-logs'
import patchClanLogsEnabledController from '@/controllers/clan-logs/patch-enabled'
import patchUnsetClanLogWebhookController from '@/controllers/clan-logs/patch-unset-webhook'
import postBulkUpdateClanLogsController from '@/controllers/clan-logs/post-bulk-update-logs'

const router: Router = Router()

router.get('/clans', getClanLogClansController)
router.get('/logs', getClanLogsController)

router.post('/bulk-update-logs', postBulkUpdateClanLogsController)

router.patch('/enabled', patchClanLogsEnabledController)
router.patch('/unset-webhook', patchUnsetClanLogWebhookController)

export default router
