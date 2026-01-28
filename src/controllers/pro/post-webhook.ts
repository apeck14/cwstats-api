import { Request, Response } from 'express'
import Stripe from 'stripe'

import logger from '@/lib/logger'
import stripeClient from '@/lib/stripe'
import { hasCWStatsUrl, validateMetadata } from '@/lib/utils'
import { assignRoleToUser, sendDiscordDM, sendWebhookEmbed, unassignRoleFromUser } from '@/services/discord'
import {
  addPlusClan,
  addProClan,
  deleteClanLogEntry,
  deletePlusClan,
  deleteProClan,
  deleteProClanByStripeId,
  deleteWarLogClanAttacks,
  getProClanByStripeId,
  isWebhookEventProcessed,
  markWebhookEventProcessed,
  setPlusClanStatus,
  setProClanStatus
} from '@/services/mongo'
import { getInvoiceSubscriptionMetadata } from '@/services/stripe'
import { getClan } from '@/services/supercell'
import colors from '@/static/colors'

const SUPPORT_SERVER_ID = '947602974367162449'
const PRO_ROLE_ID = '1413016919635660860'
const WEBHOOK_TOLERANCE = 300 // 5 minutes in seconds

/**
 * Stripe Webhook handler
 * @route POST /pro/webhook
 */
const postStripeWebhookController = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']

  if (!sig) {
    logger.error('Webhook error: Missing Stripe signature')
    res.status(400).json({ error: 'Missing Stripe signature', status: 400 })
    return
  }

  let event: Stripe.Event

  // * Important: use raw body, not parsed JSON!
  try {
    event = stripeClient.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
      WEBHOOK_TOLERANCE
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Webhook signature verification failed', { error: errorMessage })
    res.status(400).json({ error: `Webhook Error: ${errorMessage}`, status: 400 })
    return
  }

  logger.info('Processing webhook event', { eventId: event.id, eventType: event.type })

  // Idempotency check - prevent duplicate processing
  const alreadyProcessed = await isWebhookEventProcessed(event.id)
  if (alreadyProcessed) {
    logger.info('Webhook event already processed, skipping', { eventId: event.id, eventType: event.type })
    res.status(200).json({ received: true, skipped: true })
    return
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription

        // Validate required metadata
        if (!validateMetadata(subscription.metadata, ['clanName', 'clanTag', 'userId'])) {
          logger.error('Subscription created missing required metadata', {
            eventId: event.id,
            metadata: subscription.metadata,
            subscriptionId: subscription.id
          })
          res.status(400).json({ error: 'Missing required metadata', status: 400 })
          return
        }

        const { clanName, clanTag, userId } = subscription.metadata
        const active = subscription.status === 'active' || subscription.status === 'trialing'

        await Promise.all([
          addPlusClan(clanTag),
          addProClan({ active, clanName, stripeId: subscription.id, tag: clanTag }),
          assignRoleToUser(SUPPORT_SERVER_ID, userId, PRO_ROLE_ID),
          sendDiscordDM(userId, {
            color: colors.green,
            description:
              `We greatly appreciate your support and hope you enjoy the new features for ` +
              `[**${clanName}**](https://cwstats.com/clan/${clanTag.substring(1)})!\n\n` +
              `If you have any questions, suggestions or need assistance, feel free to reach out in our ` +
              `[support server](https://discord.com/invite/fFY3cnMmnH).`,
            title: 'CWStats Pro Activated! ✅'
          })
        ])

        const description =
          `**Clan**: [${clanName}](https://cwstats.com/clan/${clanTag.substring(1)})\n` +
          `**Status**: ${subscription.status}\n` +
          `**Stripe ID**: ${subscription.id}`

        sendWebhookEmbed({ color: colors.green, description, title: 'New Pro Subscription!' })

        logger.info('Subscription created successfully', {
          clanTag,
          eventId: event.id,
          subscriptionId: subscription.id
        })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        if (!validateMetadata(subscription.metadata, ['clanTag'])) {
          logger.warn('Subscription updated missing clanTag metadata', {
            eventId: event.id,
            subscriptionId: subscription.id
          })
          break
        }

        const { clanName, clanTag } = subscription.metadata
        const active = subscription.status === 'active' || subscription.status === 'trialing'

        await setProClanStatus(clanTag, active)

        // Update plus status based on active state
        if (active) {
          await setPlusClanStatus(clanTag, true)
        } else {
          // Check if clan has website URL before removing Plus
          const { data: clan } = await getClan(clanTag)

          if (!hasCWStatsUrl(clan?.description)) {
            await setPlusClanStatus(clanTag, false)
          }
        }

        logger.info('Subscription updated', {
          clanTag,
          eventId: event.id,
          status: subscription.status,
          subscriptionId: subscription.id
        })

        const description =
          `**Clan**: [${clanName || 'Unknown'}](https://cwstats.com/clan/${clanTag.substring(1)})\n` +
          `**Status**: ${subscription.status}\n` +
          `**Active**: ${active}\n` +
          `**Stripe ID**: ${subscription.id}`

        sendWebhookEmbed({ color: colors.green, description, title: 'Subscription Updated' })

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Try to get metadata from subscription, fallback to lookup by stripeId
        let clanName = subscription.metadata?.clanName
        let clanTag = subscription.metadata?.clanTag
        let userId = subscription.metadata?.userId

        // If metadata is missing, try to find the Pro clan by stripeId
        if (!clanTag) {
          logger.warn('Subscription deleted missing clanTag metadata, attempting lookup by stripeId', {
            eventId: event.id,
            subscriptionId: subscription.id
          })

          const proClan = await getProClanByStripeId(subscription.id)
          if (proClan) {
            clanTag = proClan.tag
            clanName = proClan.clanName
            logger.info('Found Pro clan by stripeId', { clanTag, subscriptionId: subscription.id })
          } else {
            // Last resort: delete by stripeId directly
            logger.warn('Could not find Pro clan, attempting delete by stripeId', {
              eventId: event.id,
              subscriptionId: subscription.id
            })
            await deleteProClanByStripeId(subscription.id)

            sendWebhookEmbed({
              color: colors.orange,
              description:
                `**Stripe ID**: ${subscription.id}\n` +
                `**Note**: Subscription deleted but metadata was missing. Cleaned up by stripeId.`,
              title: 'Pro Subscription Removed (Missing Metadata)'
            })
            break
          }
        }

        const cleanupPromises: Promise<unknown>[] = [
          getClan(clanTag),
          deleteProClan(clanTag),
          deleteClanLogEntry(clanTag),
          deleteWarLogClanAttacks(clanTag)
        ]

        // Only unassign role if we have userId
        if (userId) {
          cleanupPromises.push(unassignRoleFromUser(SUPPORT_SERVER_ID, userId, PRO_ROLE_ID))
        } else {
          logger.warn('Cannot unassign Pro role - userId missing from metadata', {
            clanTag,
            subscriptionId: subscription.id
          })
        }

        const [clanResult] = (await Promise.all(cleanupPromises)) as [{ data: { description?: string } | null }]

        if (!hasCWStatsUrl(clanResult?.data?.description)) {
          deletePlusClan(clanTag)
        }

        const description =
          `**Clan**: [${clanName || 'Unknown'}](https://cwstats.com/clan/${clanTag.substring(1)})\n` +
          `**Status**: ${subscription.status}\n` +
          `**Stripe ID**: ${subscription.id}`

        sendWebhookEmbed({ color: colors.red, description, title: 'Removed Pro Subscription!' })

        logger.info('Subscription deleted', {
          clanTag,
          eventId: event.id,
          subscriptionId: subscription.id
        })

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        const metadata = await getInvoiceSubscriptionMetadata(invoice)
        const { clanName, clanTag } = metadata || {}

        if (!clanTag) {
          logger.warn('Payment succeeded but no clanTag in metadata', { eventId: event.id, invoiceId: invoice.id })
          break
        }

        await Promise.all([setProClanStatus(clanTag, true), setPlusClanStatus(clanTag, true)])

        const description =
          `**Clan**: [${clanName || 'Unknown'}](https://cwstats.com/clan/${clanTag.substring(1)})\n` +
          `**Amount Paid**: ${(invoice.amount_paid / 100).toFixed(2)} ${invoice.currency.toUpperCase()}\n` +
          `**Status**: ${invoice.status}\n` +
          `**Invoice**: [Details](https://dashboard.stripe.com/invoices/${invoice.id})\n`

        await sendWebhookEmbed({
          color: colors.green,
          description,
          title: 'Payment Succeeded!'
        })

        logger.info('Payment succeeded', {
          amount: invoice.amount_paid,
          clanTag,
          eventId: event.id,
          invoiceId: invoice.id
        })

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        const metadata = await getInvoiceSubscriptionMetadata(invoice)
        const { clanName, clanTag, userId } = metadata || {}

        if (!clanTag) {
          logger.warn('Payment failed but no clanTag in metadata', { eventId: event.id, invoiceId: invoice.id })
          break
        }

        const [{ data: clan }] = await Promise.all([getClan(clanTag), setProClanStatus(clanTag, false)])

        if (!hasCWStatsUrl(clan?.description)) {
          setPlusClanStatus(clanTag, false)
        }

        const description =
          `**Clan**: [${clanName || 'Unknown'}](https://cwstats.com/clan/${clanTag.substring(1)})\n` +
          `**Status**: ${invoice.status}\n` +
          `**Invoice**: [Details](https://dashboard.stripe.com/invoices/${invoice.id})\n`

        await Promise.all([
          sendWebhookEmbed({
            color: colors.orange,
            description,
            title: 'Payment Failed!'
          }),
          userId
            ? sendDiscordDM(userId, {
                color: colors.red,
                description:
                  `Your payment for clan [**${clanName}**](https://cwstats.com/clan/${clanTag.substring(1)}) ` +
                  `has failed. Please update your payment information to avoid losing Pro status.\n\n` +
                  `If you believe this is a mistake, please contact ` +
                  `[support](https://discord.com/invite/fFY3cnMmnH).`,
                title: 'Payment Failed'
              })
            : Promise.resolve()
        ])

        logger.warn('Payment failed', {
          clanTag,
          eventId: event.id,
          invoiceId: invoice.id
        })

        break
      }

      default:
        logger.info('Unhandled webhook event type', { eventId: event.id, eventType: event.type })
        break
    }

    // Gather extra metadata if available
    const obj = event.data.object as { metadata?: Record<string, string>; object?: string }
    let { clanName, clanTag, userId } = obj.metadata ?? ({} as Record<string, string | undefined>)

    if (event.type.startsWith('invoice.') && obj.object === 'invoice') {
      const meta = await getInvoiceSubscriptionMetadata(obj as Stripe.Invoice)
      clanName ??= meta?.clanName
      clanTag ??= meta?.clanTag
      userId ??= meta?.userId
    }

    await markWebhookEventProcessed(event.id, event.type, {
      clanName,
      clanTag,
      processedAt: new Date().toISOString(),
      userId
    })

    res.status(200).json({ received: true })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error processing webhook event', {
      error: errorMessage,
      eventId: event.id,
      eventType: event.type,
      stack: err instanceof Error ? err.stack : undefined
    })

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default postStripeWebhookController
