import { ensureReferralProfile } from './referrals'
import { ensureSubscriptionProfile } from './subscriptions'

export async function ensureProductProfiles(authUser) {
  await Promise.all([
    ensureSubscriptionProfile(authUser),
    ensureReferralProfile(authUser),
  ])
}
