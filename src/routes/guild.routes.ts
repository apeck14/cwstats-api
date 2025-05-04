import { Router } from 'express'

import getGuildClansController from '../controllers/guild/get-guild-clans'
import patchGuildCommandCooldown from '../controllers/guild/patch-guild-command-cooldown'
import patchGuildUserNickname from '../controllers/guild/patch-guild-nickname'
import validation from '../middleware/validation'
import { guildClansSchema } from '../zod/mongo'

const router: Router = Router()

router.get('/:id/clans', validation(guildClansSchema), getGuildClansController)
router.patch('/:id/command-cooldown', patchGuildCommandCooldown)
router.patch('/:id/user-nickname', patchGuildUserNickname)

// Export router with all routes
export default router
