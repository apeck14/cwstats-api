import Stripe from 'stripe'

import { setStripeCustomerId } from '@/services/mongo'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

export async function getOrCreateCustomer(discordId: string, existingId?: null | string | undefined, name = 'Unknown') {
  if (existingId) {
    try {
      const retrieved = await stripe.customers.retrieve(existingId)
      if (!retrieved.deleted) return retrieved as Stripe.Customer
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'statusCode' in err && err.statusCode !== 404) throw err
    }
  }

  const customer = await stripe.customers.create({
    metadata: { userId: discordId },
    name
  })

  await setStripeCustomerId(discordId, customer.id)
  return customer
}

export default stripe
