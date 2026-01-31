import { Request, Response } from 'express'
import { z } from 'zod'

import { getWarLogSchema } from '@/schemas/mongo'
import { getWarLogExists } from '@/services/mongo'

type WarLogParams = z.infer<typeof getWarLogSchema>['params']

/**
 * Get war log
 * @route GET /war-logs/log/:key
 * Example key: ABC1234_20250723T081032.000Z
 */
export const getWarLogController = async (req: Request, res: Response) => {
  try {
    const { key } = req.params as WarLogParams

    const logExists = await getWarLogExists(key)

    res.status(200).json({ data: logExists })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default getWarLogController
