import { Router } from 'express'

import plusClansController from '../controllers/plus/get-plus-clans'

const router: Router = Router()

router.get('/clans', plusClansController)

// Export router with all routes
export default router
