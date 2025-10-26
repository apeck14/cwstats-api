import { formatTag } from '@/lib/format'
import stripe from '@/lib/stripe'

export const hasActiveSubscription = async (clanTag: string): Promise<boolean> => {
  try {
    const subs = await stripe.subscriptions.search({
      query: `metadata['clanTag']:'${formatTag(clanTag, true)}'`
    })

    return subs.data.some((sub) => ['active', 'trialing'].includes(sub.status))
  } catch {
    return false
  }
}

export const getProSubscription = async (subscriptionId: string) => {
  try {
    // Fetch the subscription directly
    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['plan.product']
    })

    return sub
  } catch {
    return false
  }
}
