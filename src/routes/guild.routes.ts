import { Router } from 'express'

import deleteGuildNudgeLinkController from '@/controllers/guild/delete-nudge-link'
import getGuildController from '@/controllers/guild/get-guild'
import getGuildClansController from '@/controllers/guild/get-guild-clans'
import getGuildLimitedController from '@/controllers/guild/get-guild-limited'
import patchGuildCommandCooldown from '@/controllers/guild/patch-guild-command-cooldown'
import patchGuildUserNickname from '@/controllers/guild/patch-guild-nickname'
import putGuildNudgeLinkController from '@/controllers/guild/put-nudge-link'
import validation from '@/middleware/validation'
import { guildSchema } from '@/schemas/mongo'

const router: Router = Router()

router.get('/:id', validation(guildSchema), getGuildController)
router.get('/:id/limited', validation(guildSchema), getGuildLimitedController)
router.get('/:id/clans', validation(guildSchema), getGuildClansController)
router.patch('/:id/command-cooldown', patchGuildCommandCooldown)
router.patch('/:id/user-nickname', patchGuildUserNickname)
router.put('/:id/nudge-link', putGuildNudgeLinkController)
router.delete('/:id/nudge-link', deleteGuildNudgeLinkController)

// Export router with all routes
export default router
