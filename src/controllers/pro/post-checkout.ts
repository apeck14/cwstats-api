/* eslint-disable camelcase */
import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { requireAuth } from '@/lib/auth'
import logger from '@/lib/logger'
import stripe, { getOrCreateCustomer } from '@/lib/stripe'
import { postProCheckoutSchema } from '@/schemas/mongo'
import { getAccount, getLinkedClan } from '@/services/mongo'
import { hasActiveSubscription } from '@/services/stripe'
import { getClan } from '@/services/supercell'

const BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:4400' : 'https://cwstats.com'

/**
 * Create Stripe Checkout Session for Pro subscription
 * @route POST /pro/checkout
 */
const postProCheckoutController = async (req: Request, res: Response) => {
  try {
    const parsed = postProCheckoutSchema.parse({
      body: req.body
    })

    const { clanTag } = parsed.body

    const authUser = await requireAuth(req, res)
    if (!authUser) return // Response already sent

    const { discordId, name } = authUser

    // Validate clan exists
    const [{ data: clan, error, status }, user, linkedClan, isAlreadyPro] = await Promise.all([
      getClan(clanTag),
      getAccount(discordId),
      getLinkedClan(clanTag),
      hasActiveSubscription(clanTag)
    ])

    if (!user) {
      logger.warn('Checkout attempted by non-existent user', { discordId })
      res.status(401).json({ error: 'Unauthorized', status: 401 })
      return
    }

    if (error || !clan) {
      const message = status === 404 ? 'Clan not found.' : error
      logger.warn('Checkout attempted for invalid clan', { clanTag, error, status })
      res.status(status || 404).json({ error: message, status: status || 404 })
      return
    }

    if (!linkedClan) {
      logger.warn('Checkout attempted for unlinked clan', { clanTag, discordId })
      res.status(400).json({ error: 'Clan is not linked.', status: 400 })
      return
    }

    if (isAlreadyPro) {
      logger.info('Checkout attempted for clan that already has Pro', { clanTag, discordId })
      res.status(400).json({ error: 'Clan already has Pro enabled.', status: 400 })
      return
    }

    const isAdmin = user.providerAccountId === '493245767448789023'

    const customerId = user.stripeCustomerId
    const customer = await getOrCreateCustomer(discordId, customerId, name)

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      allow_promotion_codes: true, // Allow users to apply promo codes
      cancel_url: `${BASE_URL}/checkout/cancel`,
      customer: customer.id,
      line_items: [
        {
          price: isAdmin ? process.env.STRIPE_ADMIN_PRICE_ID! : process.env.STRIPE_PRO_PRICE_ID!,
          quantity: 1
        }
      ],
      mode: 'subscription',
      subscription_data: {
        description: `PRO tier for ${clan.name} (${clan.tag})`,
        metadata: {
          clanName: clan.name,
          clanTag: clan.tag,
          guildId: linkedClan.guildID,
          userId: discordId
        }
      },
      success_url: `${BASE_URL}/checkout/success?sessionId={CHECKOUT_SESSION_ID}`
    })

    logger.info('Checkout session created successfully', {
      clanTag,
      customerId: customer.id,
      discordId,
      sessionId: session.id
    })

    res.status(201).json({ url: session.url })
  } catch (err) {
    if (err instanceof ZodError) {
      const e = err.errors[0]
      const formattedErr = `Field "${e.path.join('.')}" - ${e.message}`

      logger.warn('Checkout validation error', { error: formattedErr })

      res.status(400).json({
        error: formattedErr,
        status: 400
      })
      return
    }

    logger.error('Checkout session creation failed', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    })

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default postProCheckoutController
