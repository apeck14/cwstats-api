import { Router } from 'express'

import deleteWarLogsClanAttacksController from '@/controllers/war-logs/delete-clan-attacks'
import getWarLogClanAttacksController from '@/controllers/war-logs/get-attacks'
import getWarLogClansController from '@/controllers/war-logs/get-clans'
import getWarLogController from '@/controllers/war-logs/get-log'
import postBulkUpdateWarLogAttacksController from '@/controllers/war-logs/post-bulk-update-attacks'
import postWarLogsBulkUpdateLastUpdatedController from '@/controllers/war-logs/post-bulk-update-last-updated'
import postWarLogsController from '@/controllers/war-logs/post-logs'
import putWarLogClanAttacksController from '@/controllers/war-logs/put-clan-attacks'
import validation from '@/middleware/validation'
import { getWarLogSchema } from '@/schemas/mongo'
import { clanSchema } from '@/schemas/supercell'

const router: Router = Router()

router.get('/clans', getWarLogClansController)
router.get('/attacks', getWarLogClanAttacksController)
router.get('/log/:key', validation(getWarLogSchema), getWarLogController)

router.put('/attacks', putWarLogClanAttacksController)

router.post('/logs', postWarLogsController)
router.post('/bulk-update-attacks', postBulkUpdateWarLogAttacksController)
router.post('/bulk-update-last-updated', postWarLogsBulkUpdateLastUpdatedController)

router.delete('/:tag/attacks', validation(clanSchema), deleteWarLogsClanAttacksController)

export default router
