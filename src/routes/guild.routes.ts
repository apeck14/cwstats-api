import { Router } from 'express'

import getGuildController from '@/controllers/guild/get-guild'
import getGuildClansController from '@/controllers/guild/get-guild-clans'
import getGuildLimitedController from '@/controllers/guild/get-guild-limited'
import patchGuildCommandCooldown from '@/controllers/guild/patch-guild-command-cooldown'
import patchGuildUserNickname from '@/controllers/guild/patch-guild-nickname'
import validation from '@/middleware/validation'
import { guildSchema } from '@/schemas/mongo'

const router: Router = Router()

router.get('/:id', validation(guildSchema), getGuildController)
router.get('/:id/limited', validation(guildSchema), getGuildLimitedController)
router.get('/:id/clans', validation(guildSchema), getGuildClansController)
router.patch('/:id/command-cooldown', patchGuildCommandCooldown)
router.patch('/:id/user-nickname', patchGuildUserNickname)

// Export router with all routes
export default router
