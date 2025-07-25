import { Request, Response } from 'express'

import { formatTag } from '@/lib/format'
import {
  deleteGuildFreeWarLogClan,
  deletePlusClan,
  deleteWarLogClanAttacks,
  deleteWebhook,
  getLinkedClan,
  sliceGuildPlusFeatures,
} from '@/services/mongo'

/**
 * Delete plus clan
 * @route DELETE /plus/clan/:tag
 */
export const deletePlusClanController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const [linkedClan] = await Promise.all([
      getLinkedClan(tag),
      deletePlusClan(tag),
      deleteWebhook(tag),
      deleteGuildFreeWarLogClan(tag),
      deleteWarLogClanAttacks(tag),
    ])

    const { nudgeLimit, playerLimit } = await sliceGuildPlusFeatures(linkedClan?.guildID || '')

    res.status(200).json({ nudgeLimit, playerLimit, success: true, tag: formatTag(tag, true) })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default deletePlusClanController
