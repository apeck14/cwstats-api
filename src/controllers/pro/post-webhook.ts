/* eslint-disable no-console */
import { Request, Response } from 'express'
import Stripe from 'stripe'

import stripe from '@/lib/stripe'
import { sendWebhookEmbed } from '@/services/discord'
import { addProClan, deleteProClan, setProClanStatus } from '@/services/mongo'
import colors from '@/static/colors'

/**
 * Stripe Webhook handler
 * @route POST /pro/webhook
 */
const postStripeWebhookController = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']

  if (!sig) {
    return res.status(400).json({ error: 'Missing Stripe signature', status: 400 })
  }

  // * Important: use raw body, not parsed JSON!
  const event: Stripe.Event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!,
  )

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription

        const { clanName, clanTag } = subscription.metadata
        const active = subscription.status === 'active' || subscription.status === 'trialing'

        await addProClan({ active, clanName, stripeId: subscription.id, tag: clanTag })

        const description =
          `**Clan**: [${clanName}](https://cwstats.com/${clanTag.substring(1)})\n` +
          `**Status**: ${subscription.status}\n` +
          `**Stripe ID**: ${subscription.id}`

        sendWebhookEmbed({ color: colors.green, description, title: 'New Pro Subscription!' })

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const { clanName, clanTag } = subscription.metadata

        await deleteProClan(clanTag)

        const description =
          `**Clan**: [${clanName}](https://cwstats.com/${clanTag.substring(1)})\n` +
          `**Status**: ${subscription.status}\n` +
          `**Stripe ID**: ${subscription.id}`

        sendWebhookEmbed({ color: colors.red, description, title: 'Removed Pro Subscription!' })

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const { clanName, clanTag } = invoice.metadata || {}

        await setProClanStatus(clanTag, true)

        const description =
          `**Clan**: [${clanName}](https://cwstats.com/${clanTag.substring(1)})\n` +
          `**Amount Paid**: ${(invoice.amount_paid / 100).toFixed(2)} ${invoice.currency.toUpperCase()}\n` +
          `**Status**: ${invoice.status}\n` +
          `**Invoice**: [Details](https://dashboard.stripe.com/invoices/${invoice.id})\n`

        await sendWebhookEmbed({
          color: colors.green,
          description,
          title: 'Invoice Payment Succeeded!',
        })

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const { clanName, clanTag } = invoice.metadata || {}

        await setProClanStatus(clanTag, false)

        const description =
          `**Clan**: [${clanName}](https://cwstats.com/${clanTag.substring(1)})\n` +
          `**Status**: ${invoice.status}\n` +
          `**Invoice**: [Details](https://dashboard.stripe.com/invoices/${invoice.id})\n`

        await sendWebhookEmbed({
          color: colors.green,
          description,
          title: 'Invoice Payment Failed!',
        })
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default postStripeWebhookController
