import type Stripe from 'stripe'

import { formatTag } from '@/lib/format'
import logger from '@/lib/logger'
import stripe from '@/lib/stripe'

/**
 * Subscription statuses considered "active" for Pro features
 * Note: 'past_due' is intentionally excluded - users can access portal to fix payment,
 * but Pro features are disabled until payment succeeds
 */
export const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing'] as const

/**
 * Subscription statuses that allow portal access (to manage/fix payment)
 */
export const PORTAL_ACCESS_STATUSES = ['active', 'trialing', 'past_due'] as const

/**
 * Check if a clan has an active subscription
 * @param clanTag - Clan tag to check
 * @returns true if the clan has an active or trialing subscription
 */
export const hasActiveSubscription = async (clanTag: string): Promise<boolean> => {
  try {
    const formattedTag = formatTag(clanTag, true)
    const subs = await stripe.subscriptions.search({
      query: `metadata['clanTag']:'${formattedTag}'`
    })

    const hasActive = subs.data.some((sub) =>
      ACTIVE_SUBSCRIPTION_STATUSES.includes(sub.status as 'active' | 'trialing')
    )

    logger.debug('Checked subscription status', { clanTag: formattedTag, hasActive })

    return hasActive
  } catch (err) {
    logger.error('Error checking subscription status', {
      clanTag,
      error: err instanceof Error ? err.message : 'Unknown error'
    })
    return false
  }
}

/**
 * Get subscription details by subscription ID
 * @param subscriptionId - Stripe subscription ID
 * @returns Subscription object or false if not found
 */
export const getProSubscription = async (subscriptionId: string): Promise<false | Stripe.Subscription> => {
  try {
    // Fetch the subscription directly
    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['plan.product']
    })

    logger.debug('Retrieved subscription', { subscriptionId })

    return sub
  } catch (err) {
    logger.error('Error retrieving subscription', {
      error: err instanceof Error ? err.message : 'Unknown error',
      subscriptionId
    })
    return false
  }
}

/**
 * Get subscription metadata from an invoice
 * Retrieves the associated subscription to access its metadata
 * Note: In Stripe API 2025-12-15.clover, subscription info is in parent.subscription_details
 */
export const getInvoiceSubscriptionMetadata = async (
  invoice: Stripe.Invoice
): Promise<Record<string, string> | undefined> => {
  // In newer Stripe API versions, metadata is on parent.subscription_details
  const subscriptionDetails = invoice.parent?.subscription_details

  if (subscriptionDetails?.metadata) {
    return subscriptionDetails.metadata as Record<string, string>
  }

  // Fallback: try to get subscription ID from parent and retrieve full subscription
  const subscriptionRef = subscriptionDetails?.subscription

  if (!subscriptionRef) {
    logger.debug('Invoice has no subscription', { invoiceId: invoice.id })
    return undefined
  }

  // If it's already expanded as an object, use its metadata directly
  if (typeof subscriptionRef !== 'string') {
    return subscriptionRef.metadata as Record<string, string>
  }

  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionRef)
    return sub.metadata as Record<string, string>
  } catch (err) {
    logger.error('Failed to retrieve subscription for invoice', {
      error: err instanceof Error ? err.message : 'Unknown error',
      invoiceId: invoice.id,
      subscriptionId: subscriptionRef
    })
    return undefined
  }
}

/**
 * Get the redirect URL for a checkout session
 * Used after successful checkout to redirect user to their clan page
 */
export const getCheckoutRedirectUrl = async (sessionId: string): Promise<string> => {
  try {
    if (!sessionId) {
      logger.warn('Missing session ID for redirect')
      return '/404_'
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session.subscription) {
      logger.warn('Session has no subscription', { sessionId })
      return '/404_'
    }

    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    const guildId = subscription?.metadata?.guildId

    if (guildId) {
      return `/me/servers/${guildId}/clans`
    }

    logger.warn('Subscription missing guildId metadata', { sessionId, subscriptionId: subscription.id })
    return '/404_'
  } catch (err) {
    logger.error('Error retrieving checkout redirect URL', {
      error: err instanceof Error ? err.message : 'Unknown error',
      sessionId
    })
    return '/404_'
  }
}
