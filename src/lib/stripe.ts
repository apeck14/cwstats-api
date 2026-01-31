import Stripe from 'stripe'

import logger from '@/lib/logger'
import { setStripeCustomerId } from '@/services/mongo'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
  maxNetworkRetries: 3,
  timeout: 30000 // 30 seconds
})

/**
 * Search for a Stripe customer by Discord ID metadata
 * If multiple customers exist, keeps the one with subscriptions and deletes duplicates
 * Also updates the database with the found customer ID
 */
export async function findCustomerByDiscordId(discordId: string): Promise<null | Stripe.Customer> {
  try {
    // Search for ALL customers with this Discord ID (not just limit 1)
    const existingCustomers = await stripe.customers.search({
      expand: ['data.subscriptions'],
      limit: 100,
      query: `metadata['userId']:'${discordId}'`
    })

    if (existingCustomers.data.length === 0) {
      return null
    }

    // If only one customer, use it
    if (existingCustomers.data.length === 1) {
      const customer = existingCustomers.data[0]
      logger.info('Found single customer by Discord ID', { customerId: customer.id, discordId })
      await setStripeCustomerId(discordId, customer.id)
      return customer
    }

    // Multiple customers exist - find the best one (most subscriptions, preferring active ones)
    const customersWithSubs = existingCustomers.data
      .map((customer) => ({
        activeSubCount:
          customer.subscriptions?.data.filter((s) => ['active', 'trialing', 'past_due'].includes(s.status)).length || 0,
        customer,
        totalSubCount: customer.subscriptions?.data.length || 0
      }))
      .sort((a, b) => {
        // Prioritize active subscriptions, then total subscriptions
        if (b.activeSubCount !== a.activeSubCount) {
          return b.activeSubCount - a.activeSubCount
        }
        return b.totalSubCount - a.totalSubCount
      })

    const primaryCustomer = customersWithSubs[0].customer
    const duplicates = customersWithSubs.slice(1).map((c) => c.customer)

    logger.info('Multiple customers found, selecting primary and cleaning up duplicates', {
      discordId,
      duplicateCount: duplicates.length,
      duplicateIds: duplicates.map((c) => c.id),
      primaryCustomerId: primaryCustomer.id,
      primarySubscriptionCount: customersWithSubs[0].totalSubCount
    })

    // Delete duplicate customers (only if they have no subscriptions)
    for (const duplicate of duplicates) {
      const hasSubscriptions = (duplicate.subscriptions?.data.length || 0) > 0

      if (hasSubscriptions) {
        logger.warn('Cannot delete duplicate customer with subscriptions', {
          customerId: duplicate.id,
          discordId,
          subscriptionCount: duplicate.subscriptions?.data.length
        })
        continue
      }

      try {
        await stripe.customers.del(duplicate.id)
        logger.info('Deleted duplicate Stripe customer', { customerId: duplicate.id, discordId })
      } catch (err) {
        logger.error('Failed to delete duplicate customer', {
          customerId: duplicate.id,
          discordId,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // Update database with primary customer
    await setStripeCustomerId(discordId, primaryCustomer.id)

    return primaryCustomer
  } catch (err) {
    logger.error('Error searching for customer by Discord ID', {
      discordId,
      error: err instanceof Error ? err.message : 'Unknown error'
    })
    return null
  }
}

/**
 * Get or create a Stripe customer with duplicate prevention
 * Searches for existing customers by Discord ID to prevent duplicates
 */
export async function getOrCreateCustomer(discordId: string, existingId?: null | string | undefined, name = 'Unknown') {
  // First, try to retrieve the customer if we have an ID
  if (existingId) {
    try {
      const retrieved = await stripe.customers.retrieve(existingId)
      if (!retrieved.deleted) {
        logger.info('Retrieved existing Stripe customer', { customerId: existingId, discordId })
        return retrieved as Stripe.Customer
      }
      logger.warn('Customer was deleted, will create new one', { customerId: existingId, discordId })
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'statusCode' in err) {
        if (err.statusCode === 404) {
          logger.warn('Customer not found in Stripe', { customerId: existingId, discordId })
        } else {
          logger.error('Error retrieving customer', {
            customerId: existingId,
            discordId,
            error: err instanceof Error ? err.message : 'Unknown error'
          })
          throw err
        }
      }
    }
  }

  // Search for existing customer by Discord ID to prevent duplicates
  try {
    const existingCustomers = await stripe.customers.search({
      limit: 1,
      query: `metadata['userId']:'${discordId}'`
    })

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0]
      logger.info('Found existing customer by Discord ID', { customerId: customer.id, discordId })

      // Update our database with the found customer ID
      await setStripeCustomerId(discordId, customer.id)

      return customer
    }
  } catch (err) {
    logger.error('Error searching for existing customers', {
      discordId,
      error: err instanceof Error ? err.message : 'Unknown error'
    })
    // Continue to create new customer if search fails
  }

  // Create new customer
  try {
    const customer = await stripe.customers.create({
      metadata: { userId: discordId },
      name
    })

    await setStripeCustomerId(discordId, customer.id)

    logger.info('Created new Stripe customer', { customerId: customer.id, discordId })

    return customer
  } catch (err) {
    logger.error('Error creating Stripe customer', {
      discordId,
      error: err instanceof Error ? err.message : 'Unknown error'
    })
    throw err
  }
}

export default stripe
