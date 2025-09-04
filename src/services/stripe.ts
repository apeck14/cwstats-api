import { formatTag } from '@/lib/format'
import stripe from '@/lib/stripe'

export const hasActiveSubscription = async (clanTag: string): Promise<boolean> => {
  try {
    const subscriptions = await stripe.subscriptions.search({
      query: `metadata['clanTag']:'${formatTag(clanTag, true)}' AND (status:'active' OR status:'trialing')`,
    })
    return subscriptions.data.length > 0
  } catch (error) {
    return false
  }
}
