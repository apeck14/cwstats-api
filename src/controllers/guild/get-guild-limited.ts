import { Request, Response } from 'express'

import { getGuild } from '../../services/mongo'

/**
 * Get guild data by id
 * @route GET /guild/:id/limited
 */
export const getGuildLimitedController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const data = await getGuild(id, true)

    if (!data) {
      res.status(404).json({ error: 'Guild not found', status: 404 })
      return
    }

    res.status(200).json(data)
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getGuildLimitedController
