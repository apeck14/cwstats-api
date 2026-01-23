import { Request, Response } from 'express'

import { formatTag } from '@/lib/format'
import { deletePlusClan, deleteWarLogClanAttacks, getLinkedClan, sliceGuildPlusFeatures } from '@/services/mongo'
import { hasActiveSubscription } from '@/services/stripe'

/**
 * Delete plus clan
 * @route DELETE /plus/clan/:tag
 */
export const deletePlusClanController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const isPro = await hasActiveSubscription(tag)

    if (isPro) {
      res.status(409).json({ error: 'Clan has pro enabled.', status: 409 })
      return
    }

    const [linkedClan] = await Promise.all([getLinkedClan(tag), deletePlusClan(tag), deleteWarLogClanAttacks(tag)])

    const { nudgeLimit, playerLimit } = await sliceGuildPlusFeatures(linkedClan?.guildID || '')

    res.status(200).json({ nudgeLimit, playerLimit, success: true, tag: formatTag(tag, true) })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default deletePlusClanController
