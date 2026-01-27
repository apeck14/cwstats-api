/* eslint-disable camelcase */
import { Request, Response } from 'express'
import type Stripe from 'stripe'
import { ZodError } from 'zod'

import { requireAuth } from '@/lib/auth'
import logger from '@/lib/logger'
import stripe, { findCustomerByDiscordId } from '@/lib/stripe'
import { getAccount } from '@/services/mongo'
import { PORTAL_ACCESS_STATUSES } from '@/services/stripe'

const BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:4400' : 'https://cwstats.com'

const NO_SUBSCRIPTION_RESPONSE = {
  code: 'NO_SUBSCRIPTION',
  error: 'No active subscription found. Please subscribe first.',
  status: 403
} as const

/**
 * Create Stripe Customer Portal Session for managing subscriptions
 * @route POST /pro/portal
 */
const postProPortalController = async (req: Request, res: Response) => {
  try {
    const authUser = await requireAuth(req, res)
    if (!authUser) return // Response already sent

    const { discordId } = authUser

    const user = await getAccount(discordId)

    if (!user) {
      logger.warn('Portal access attempted by non-existent user', { discordId })
      res.status(401).json({ error: 'User not found', status: 401 })
      return
    }

    let customer: Stripe.Customer | undefined

    // If no customer ID in database, try to find by Discord ID in Stripe (recovery mechanism)
    if (!user.stripeCustomerId) {
      logger.info('No stripeCustomerId in database, attempting recovery by Discord ID search', { discordId })

      const foundCustomer = await findCustomerByDiscordId(discordId)
      if (foundCustomer) {
        logger.info('Successfully recovered customer from Stripe', {
          customerId: foundCustomer.id,
          discordId
        })
        customer = foundCustomer
      } else {
        logger.info('Portal access attempted by user with no customer ID', { discordId })
        res.status(403).json(NO_SUBSCRIPTION_RESPONSE)
        return
      }
    }

    // If we have a stored customer ID, retrieve from Stripe
    if (!customer && user.stripeCustomerId) {
      try {
        const retrieved = await stripe.customers.retrieve(user.stripeCustomerId, {
          expand: ['subscriptions']
        })

        if (retrieved.deleted) {
          // Customer was deleted in Stripe - try recovery by Discord ID
          logger.warn('Stored customer was deleted in Stripe, attempting recovery', {
            customerId: user.stripeCustomerId,
            discordId
          })

          const foundCustomer = await findCustomerByDiscordId(discordId)
          if (foundCustomer) {
            customer = foundCustomer
          } else {
            // No recovery possible - but DON'T clear the ID, just return error
            logger.warn('Could not recover deleted customer', { discordId })
            res.status(403).json(NO_SUBSCRIPTION_RESPONSE)
            return
          }
        } else {
          customer = retrieved as Stripe.Customer
        }
      } catch (stripeErr: unknown) {
        // Customer doesn't exist - try recovery by Discord ID
        if (
          typeof stripeErr === 'object' &&
          stripeErr !== null &&
          'statusCode' in stripeErr &&
          stripeErr.statusCode === 404
        ) {
          logger.warn('Customer not found in Stripe, attempting recovery by Discord ID', {
            customerId: user.stripeCustomerId,
            discordId
          })

          const foundCustomer = await findCustomerByDiscordId(discordId)
          if (foundCustomer) {
            customer = foundCustomer
          } else {
            // No recovery possible - but DON'T clear the ID in case of Stripe API issues
            logger.warn('Could not find or recover customer', { discordId })
            res.status(403).json(NO_SUBSCRIPTION_RESPONSE)
            return
          }
        } else {
          logger.error('Error retrieving customer for portal', {
            customerId: user.stripeCustomerId,
            discordId,
            error: stripeErr instanceof Error ? stripeErr.message : 'Unknown error'
          })
          throw stripeErr
        }
      }
    }

    if (!customer) {
      logger.error('No customer found after all attempts', { discordId })
      res.status(403).json(NO_SUBSCRIPTION_RESPONSE)
      return
    }

    // Check if user has any subscriptions that allow portal access
    const subscriptions = (customer as Stripe.Customer & { subscriptions?: Stripe.ApiList<Stripe.Subscription> })
      .subscriptions
    const hasPortalAccess = subscriptions?.data.some((sub) =>
      PORTAL_ACCESS_STATUSES.includes(sub.status as 'active' | 'past_due' | 'trialing')
    )

    if (!hasPortalAccess) {
      logger.info('Portal access attempted by user with no active subscriptions', {
        customerId: customer.id,
        discordId,
        subscriptionCount: subscriptions?.data.length || 0
      })
      res.status(403).json(NO_SUBSCRIPTION_RESPONSE)
      return
    }

    // Create Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: BASE_URL
    })

    logger.info('Portal session created successfully', {
      customerId: customer.id,
      discordId,
      sessionId: portalSession.id
    })

    res.status(201).json({ url: portalSession.url })
  } catch (err) {
    if (err instanceof ZodError) {
      const e = err.errors[0]
      const formattedErr = `Field "${e.path.join('.')}" - ${e.message}`

      logger.warn('Portal validation error', { error: formattedErr })

      res.status(400).json({
        error: formattedErr,
        status: 400
      })
      return
    }

    logger.error('Portal session creation failed', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    })

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default postProPortalController
