import stripe from '@/lib/stripe'

export const hasActiveSubscription = async (clanTag: string): Promise<boolean> => {
  try {
    const subscriptions = await stripe.subscriptions.search({
      query: `metadata['clanTag']:'${clanTag}' AND status:'active'`,
    })
    return subscriptions.data.length > 0
  } catch (error) {
    return false
  }
}
