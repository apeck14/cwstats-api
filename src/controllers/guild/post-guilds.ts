import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { guildsSchema } from '@/schemas/mongo'
import { getGuilds } from '@/services/mongo'

/**
 * Get guilds by query
 * @route POST /guilds
 */
export const postGuildsController = async (req: Request, res: Response) => {
  try {
    const parsed = guildsSchema.parse({
      body: req.body,
    })

    const { query } = parsed.body

    const guilds = await getGuilds(query)

    res.status(200).json({ data: guilds || [] })
  } catch (err) {
    if (err instanceof ZodError) {
      const e = err.errors[0]
      const formattedErr = `Field "${e.path.join('.')}" - ${e.message}`

      res.status(400).json({
        error: formattedErr,
        status: 400,
      })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default postGuildsController
