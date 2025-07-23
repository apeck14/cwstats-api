import { Router } from 'express'

import deleteGuildController from '@/controllers/guild/delete-guild'
import deleteGuildNudgeController from '@/controllers/guild/delete-nudge'
import deleteGuildNudgeLinkController from '@/controllers/guild/delete-nudge-link'
import getLinkedClans from '@/controllers/guild/get-all-linked-clans'
import getGuildController from '@/controllers/guild/get-guild'
import getGuildClansController from '@/controllers/guild/get-guild-clans'
import getGuildLimitedController from '@/controllers/guild/get-guild-limited'
import patchFreeWarLogClanController from '@/controllers/guild/patch-free-war-log-clan'
import patchGuildCommandCooldown from '@/controllers/guild/patch-guild-command-cooldown'
import patchGuildUserNickname from '@/controllers/guild/patch-guild-nickname'
import postGuildController from '@/controllers/guild/post-guild'
import postGuildsController from '@/controllers/guild/post-guilds'
import putGuildNudgeLinkController from '@/controllers/guild/put-nudge-link'
import validation from '@/middleware/validation'
import { deleteGuildNudgeLinkSchema, guildSchema } from '@/schemas/mongo'

const router: Router = Router()

router.get('/clans', getLinkedClans)
router.get('/:id', validation(guildSchema), getGuildController)
router.get('/:id/limited', validation(guildSchema), getGuildLimitedController)
router.get('/:id/clans', validation(guildSchema), getGuildClansController)

router.post('/guilds', postGuildsController)
router.post('/:id', validation(guildSchema), postGuildController)

router.delete('/nudge', deleteGuildNudgeController)
router.delete('/:id', validation(guildSchema), deleteGuildController)
router.delete('/:id/nudge-link/:tag', validation(deleteGuildNudgeLinkSchema), deleteGuildNudgeLinkController)

router.patch('/free-war-log-clan', patchFreeWarLogClanController)
router.patch('/:id/command-cooldown', patchGuildCommandCooldown)
router.patch('/:id/user-nickname', patchGuildUserNickname)

router.put('/:id/nudge-link', putGuildNudgeLinkController)

// Export router with all routes
export default router
