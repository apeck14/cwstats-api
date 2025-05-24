import { Router } from 'express'

import linkedAccountController from '@/controllers/user/get-linked-account'
import validation from '@/middleware/validation'
import { linkedAccountSchema } from '@/schemas/supercell'

const router: Router = Router()

router.get('/:userId/linked-account', validation(linkedAccountSchema), linkedAccountController)

// Export router with all routes
export default router
