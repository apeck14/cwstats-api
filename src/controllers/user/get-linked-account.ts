import { Request, Response } from 'express'
import { z } from 'zod'

import { linkedAccountSchema } from '@/schemas/supercell'
import { getLinkedAccount } from '@/services/mongo'

type LinkedAccountParams = z.infer<typeof linkedAccountSchema>['params']

/**
 * Get linked account
 * @route GET /user/:userId/linked-account
 */
export const linkedAccountController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as LinkedAccountParams

    const linkedAccount = await getLinkedAccount(userId)

    if (!linkedAccount) {
      res.status(404).json({ error: 'Linked account not found.', status: 404 })
      return
    }

    res.status(200).json({ data: linkedAccount })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default linkedAccountController
