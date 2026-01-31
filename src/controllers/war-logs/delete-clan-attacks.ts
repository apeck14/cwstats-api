// delete a single clan attacks document
import { Request, Response } from 'express'
import { z } from 'zod'

import { clanSchema } from '@/schemas/supercell'
import { deleteWarLogClanAttacks } from '@/services/mongo'

type ClanParams = z.infer<typeof clanSchema>['params']

/**
 * Delete a clan war logs attacks entry
 * @route DELETE /war-logs/:tag/attacks
 */
export const deleteWarLogsClanAttacksController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params as ClanParams

    const { deletedCount } = await deleteWarLogClanAttacks(tag)

    if (!deletedCount) {
      res.status(404).json({ error: 'Clan attacks entry not found.', status: 404 })
      return
    }

    res.status(200).json({ success: true })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default deleteWarLogsClanAttacksController
