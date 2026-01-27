import { Request, Response } from 'express'
import { JWTPayload } from 'jose'

import logger from '@/lib/logger'
import { verifyUserToken } from '@/lib/utils'

export interface AuthenticatedUser {
  discordId: string
  name: string
  payload: JWTPayload
}

export interface AuthResult {
  error?: { message: string; status: number }
  user?: AuthenticatedUser
}

/**
 * Extract and verify user from x-user-token header
 * Returns the authenticated user or an error object
 */
export async function authenticateUserToken(req: Request): Promise<AuthResult> {
  const userToken = req.headers['x-user-token']

  if (!userToken || Array.isArray(userToken)) {
    logger.warn('Request attempted without user token', { path: req.path })
    return { error: { message: 'Unauthorized', status: 401 } }
  }

  const userPayload = (await verifyUserToken(userToken)) as JWTPayload & {
    name?: string
    user?: { discord_id?: string }
  }

  const discordId = userPayload?.user?.discord_id

  if (!discordId) {
    logger.warn('Request attempted with invalid user token', { path: req.path })
    return { error: { message: 'Unauthorized', status: 401 } }
  }

  return {
    user: {
      discordId,
      name: (userPayload?.name || 'Unknown') as string,
      payload: userPayload
    }
  }
}

/**
 * Middleware-style helper that sends error response if auth fails
 * Returns the authenticated user or null (and sends response)
 */
export async function requireAuth(req: Request, res: Response): Promise<AuthenticatedUser | null> {
  const result = await authenticateUserToken(req)

  if (result.error) {
    res.status(result.error.status).json({ error: result.error.message, status: result.error.status })
    return null
  }

  return result.user!
}
