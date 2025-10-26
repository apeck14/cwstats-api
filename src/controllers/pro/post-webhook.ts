/* eslint-disable no-console */
import { Request, Response } from 'express'
import Stripe from 'stripe'

import stripe from '@/lib/stripe'
import { assignRoleToUser, sendDiscordDM, sendWebhookEmbed, unassignRoleFromUser } from '@/services/discord'
import {
  addPlusClan,
  addProClan,
  deleteClanLogEntry,
  deletePlusClan,
  deleteProClan,
  deleteWarLogClanAttacks,
  setPlusClanStatus,
  setProClanStatus
} from '@/services/mongo'
import { getClan } from '@/services/supercell'
import colors from '@/static/colors'

const SUPPORT_SERVER_ID = '947602974367162449'
const PRO_ROLE_ID = '1413016919635660860'

/**
 * Stripe Webhook handler
 * @route POST /pro/webhook
 */
const postStripeWebhookController = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']

  if (!sig) {
    res.status(400).json({ error: 'Missing Stripe signature', status: 400 })
    return
  }

  // * Important: use raw body, not parsed JSON!
  const event: Stripe.Event = stripe.webhooks.constructEvent(
    req.body as Buffer,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  )

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription

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

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const { clanName, clanTag, userId } = subscription.metadata

        const [{ data: clan }] = await Promise.all([
          getClan(clanTag),
          deleteProClan(clanTag),
          deleteClanLogEntry(clanTag),
          deleteWarLogClanAttacks(clanTag),
          unassignRoleFromUser(SUPPORT_SERVER_ID, userId, PRO_ROLE_ID)
        ])

        const lowercaseDesc = clan?.description.toLowerCase()
        const hasUrlInDescription = lowercaseDesc?.includes('cwstats') || lowercaseDesc?.includes('cw-stats')

        if (!hasUrlInDescription) {
          deletePlusClan(clanTag)
        }

        const description =
          `**Clan**: [${clanName}](https://cwstats.com/clan/${clanTag.substring(1)})\n` +
          `**Status**: ${subscription.status}\n` +
          `**Stripe ID**: ${subscription.id}`

        sendWebhookEmbed({ color: colors.red, description, title: 'Removed Pro Subscription!' })

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        const { clanName, clanTag } = invoice.parent?.subscription_details?.metadata || {}

        await Promise.all([setProClanStatus(clanTag, true), setPlusClanStatus(clanTag, true)])

        const description =
          `**Clan**: [${clanName}](https://cwstats.com/clan/${clanTag.substring(1)})\n` +
          `**Amount Paid**: ${(invoice.amount_paid / 100).toFixed(2)} ${invoice.currency.toUpperCase()}\n` +
          `**Status**: ${invoice.status}\n` +
          `**Invoice**: [Details](https://dashboard.stripe.com/invoices/${invoice.id})\n`

        await sendWebhookEmbed({
          color: colors.green,
          description,
          title: 'Payment Succeeded!'
        })

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const { clanName, clanTag, userId } = invoice.parent?.subscription_details?.metadata || {}

        const [{ data: clan }] = await Promise.all([getClan(clanTag), setProClanStatus(clanTag, false)])

        const lowercaseDesc = clan?.description.toLowerCase()
        const hasUrlInDescription = lowercaseDesc?.includes('cwstats') || lowercaseDesc?.includes('cw-stats')

        if (!hasUrlInDescription) {
          setPlusClanStatus(clanTag, false)
        }

        const description =
          `**Clan**: [${clanName}](https://cwstats.com/clan/${clanTag.substring(1)})\n` +
          `**Status**: ${invoice.status}\n` +
          `**Invoice**: [Details](https://dashboard.stripe.com/invoices/${invoice.id})\n`

        await Promise.all([
          sendWebhookEmbed({
            color: colors.orange,
            description,
            title: 'Payment Failed!'
          }),
          sendDiscordDM(userId, {
            color: colors.red,
            description:
              `Your payment for clan [**${clanName}**](https://cwstats.com/clan/${clanTag.substring(1)}) ` +
              `has failed. Please update your payment information to avoid losing Pro status.\n\n` +
              `If you believe this is a mistake, please contact ` +
              `[support](https://discord.com/invite/fFY3cnMmnH).`,
            title: 'Payment Failed'
          })
        ])
        break
      }

      default:
        break
    }

    res.status(200).json({ received: true })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default postStripeWebhookController
