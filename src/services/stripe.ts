import { formatTag } from '@/lib/format'
import stripe from '@/lib/stripe'

export const hasActiveSubscription = async (clanTag: string): Promise<boolean> => {
  try {
    const subs = await stripe.subscriptions.search({
      query: `metadata['clanTag']:'${formatTag(clanTag, true)}'`,
    })

    return subs.data.some((sub) => ['active', 'trialing'].includes(sub.status))
  } catch {
    return false
  }
}
