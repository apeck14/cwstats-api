import { FilterQuery, ProjectionType } from 'mongoose'

import { connectDB } from '@/config/db'
import { formatTag } from '@/lib/format'
import { calcLinkedPlayerLimit, calcNudgeLimit } from '@/lib/utils'
import { AccountModel } from '@/models/accounts.model'
import { ClanLogMember, ClanLogModel } from '@/models/clan-log.model'
import { DailyLeaderboard, DailyLeaderboardEntry, DailyLeaderboardModel } from '@/models/daily-leaderboard.model'
import { EmojiModel } from '@/models/emoji.model'
import { Guild, GuildModel } from '@/models/guild.model'
import { LinkedAccountModel } from '@/models/linked-account.model'
import { LinkedClan, LinkedClanModel } from '@/models/linked-clan.model'
import { PlusClan, PlusClanModel } from '@/models/plus-clan.model'
import { ProClanModel } from '@/models/pro-clan.model'
import { Location, StatisticsModel } from '@/models/statistics.model'
import { WarLogModel } from '@/models/war-log.model'
import { WarLogClanAttacksModel } from '@/models/war-log-clan-attacks.model'
import { WebhookEventModel } from '@/models/webhook-event.model'
import { getRaceLog, getRiverRace } from '@/services/supercell'

interface LinkPlayerInput {
  name: string
  tag: string
  userId: string
}

interface CommandCooldownInput {
  commandName: string
  delay: number
  id: string
}

interface DailyLeaderboardInput {
  limit: number
  maxTrophies: number
  minTrophies: number
  name?: string
}

interface NudgeLinkInput {
  guildId: string
  name: string
  tag: string
  userId: string
}

interface DeleteNudgeLinkInput {
  guildId: string
  tag: string
}

interface DeleteNudgeInput {
  guildId: string
  scheduledHourUTC: number
  tag: string
}

interface Emoji {
  emoji: string
  name: string
}

interface PartialDailyTrackingEntry {
  season: number
  timestamp: string
}

interface DailyTrackingEntryScore {
  attacks: number
  fame: number
  missed: boolean
  name: string
  notInClan?: boolean
  tag: string
}

interface FullDailyTrackingEntry {
  day: number
  scores: DailyTrackingEntryScore[]
  season: number
  tag: string
  timestamp: string
  week: number
}

interface RiserFallerEntry {
  badgeId: number
  clanScore: number
  location: Location
  members: number
  name: string
  previousRank: number
  rank: number
  tag: string
}

interface WarLogInput {
  tag: string
  timestamp: Date
}

interface WarLogClanAttacksInput {
  attacks: Record<string, number>
  dayIndex: number
  tag: string
}

interface LastUpdatedInput {
  tag: string
  timestamp: number
}

interface ProClanInput {
  active: boolean
  clanName: string
  stripeId: string
  tag: string
}

interface SetWarLogClanInput {
  tag: string
  webhookUrl1?: string
  webhookUrl2?: string
}

interface ClanLogsInput {
  badge: string
  clanWarTrophies: number
  description: string
  locationId: number
  members: ClanLogMember[]
  requiredTrophies: number
  tag: string
  type: string
}

// list of randomly selected tags to check river race logs of to determine current season
const TAGS = [
  '#PJQRLQPQ',
  '#Y9202P9U',
  '#YGL9RC9C',
  '#PY0Y2CGQ',
  '#L9VRJ',
  '#Y2VCUC92',
  '#LGL99QP9',
  '#PPLCV9G2',
  '#PQGYPCV0',
  '#2QRCQVPR',
  '#9RLJ8V2J',
  '#20LUQGRQ',
  '#YPJLQ999',
  '#9CRYRJ',
  '#98RVLCUY'
]

export const linkPlayer = async ({ name, tag, userId }: LinkPlayerInput) => {
  await connectDB()

  const account = await LinkedAccountModel.updateOne(
    { discordID: userId },
    {
      $set: { tag },
      $setOnInsert: { savedPlayers: [{ name, tag }] }
    },
    { upsert: true }
  )

  return account
}

// set function overloading for typescript
export function getPlusClans(tagsOnly: true, query: object, projection: object): Promise<string[]>
export function getPlusClans(tagsOnly: false, query: object, projection: object): Promise<PlusClan[]>
export function getPlusClans(tagsOnly: boolean, query: object, projection: object): Promise<PlusClan[] | string[]>
export async function getPlusClans(
  tagsOnly: boolean,
  query: object,
  projection: object
): Promise<PlusClan[] | string[]> {
  await connectDB()

  const plusClans = await PlusClanModel.find(
    {
      $or: [{ active: true }, { active: { $exists: false } }],
      ...query
    },
    { _id: 0, ...projection }
  ).lean<PlusClan[]>()

  if (tagsOnly) {
    return plusClans.map((doc) => doc.tag)
  }

  return plusClans
}

export const getGuild = async (id: string, limited?: boolean) => {
  await connectDB()

  const projection: ProjectionType<Guild> = limited ? { _id: 0, nudges: 0 } : { _id: 0 }

  const guild = await GuildModel.findOne({ guildID: id }, { ...projection }).lean()

  return guild
}

export const getGuilds = async (query: object) => {
  await connectDB()

  const guilds = await GuildModel.find({ ...query }, { _id: 0 }).lean()

  return guilds
}

export const getLinkedClansByGuild = async (id: string): Promise<LinkedClan[]> => {
  await connectDB()

  const linkedClans = await LinkedClanModel.find({ guildID: id }, { _id: 0 }).lean<LinkedClan[]>()

  return linkedClans
}

export const getLinkedClan = async (tag: string): Promise<LinkedClan | null> => {
  await connectDB()

  const linkedClan = await LinkedClanModel.findOne({ tag: formatTag(tag, true) }, { _id: 0 }).lean<LinkedClan>()

  return linkedClan
}

export const getAllLinkedClans = async (): Promise<LinkedClan[]> => {
  await connectDB()

  const linkedClans = await LinkedClanModel.find({}, { _id: 0 }).lean<LinkedClan[]>()

  return linkedClans
}

export const setCommandCooldown = async ({ commandName, delay, id }: CommandCooldownInput) => {
  await connectDB()

  const now = new Date()
  now.setMilliseconds(now.getMilliseconds() + delay)

  const query = await GuildModel.updateOne(
    { guildID: id },
    {
      $set: {
        [`cooldowns.${commandName}`]: now
      }
    }
  )

  return query
}

export const getDailyLeaderboard = async ({ limit, maxTrophies, minTrophies, name }: DailyLeaderboardInput) => {
  await connectDB()

  const query: FilterQuery<DailyLeaderboard> = {
    clanScore: {
      ...(minTrophies ? { $gte: minTrophies } : {}),
      ...(maxTrophies ? { $lte: maxTrophies } : {})
    }
  }

  // if no name provided, assume global (all clans)
  if (name) query['location.name'] = name

  const dailyLb = await DailyLeaderboardModel.aggregate([
    { $match: query },
    {
      $addFields: {
        rankNull: { $cond: [{ $eq: ['$rank', null] }, 1, 0] }
      }
    },
    {
      $sort: {
        notRanked: 1, // ranked first
        // eslint-disable-next-line perfectionist/sort-objects
        fameAvg: -1, // fame descending
        rankNull: 1, // non-null ranks first
        // eslint-disable-next-line perfectionist/sort-objects
        rank: 1 // then sort by rank ascending
      }
    },
    ...(limit ? [{ $limit: limit }] : [])
  ])

  return dailyLb
}

export const getStatistics = async () => {
  await connectDB()

  const stats = await StatisticsModel.findOne({})

  return stats
}

export const getLinkedAccount = async (userId: string) => {
  await connectDB()

  const linkedAccount = await LinkedAccountModel.findOne({ discordID: userId }, { __v: 0, _id: 0 }).lean()

  return linkedAccount
}

export const addLinkedAccount = async (userId: string, tag: string) => {
  await connectDB()

  const result = await LinkedAccountModel.create({ discordID: userId, tag })

  return result
}

export const addNudgeLink = async ({ guildId, name, tag, userId }: NudgeLinkInput) => {
  await connectDB()

  const result = await GuildModel.updateOne(
    {
      guildID: guildId,
      'nudges.links.tag': { $ne: tag } // Only update if no existing link with this tag
    },
    {
      $push: {
        'nudges.links': {
          discordID: userId,
          name,
          tag
        }
      }
    }
  )

  return result
}

export const deleteNudgeLink = async ({ guildId, tag }: DeleteNudgeLinkInput) => {
  await connectDB()

  const result = await GuildModel.updateOne(
    { guildID: guildId },
    {
      $pull: {
        'nudges.links': { tag }
      }
    }
  )

  return result
}

export const deleteNudge = async ({ guildId, scheduledHourUTC, tag }: DeleteNudgeInput) => {
  await connectDB()

  const result = await GuildModel.updateOne(
    { guildID: guildId },
    {
      $pull: {
        'nudges.scheduled': { clanTag: tag, scheduledHourUTC }
      }
    }
  )

  return result
}

export const createGuild = async (guildId: string) => {
  await connectDB()

  const result = await GuildModel.updateOne(
    { guildID: guildId },
    { $setOnInsert: { guildID: guildId } },
    { upsert: true }
  )

  return result
}

export const deleteGuild = async (id: string) => {
  await connectDB()

  const result = await GuildModel.deleteOne({ guildID: id })
  return result
}

export const deleteLinkedClans = async (id: string) => {
  await connectDB()

  const result = await LinkedClanModel.deleteMany({ guildID: id })
  return result
}

export const bulkWriteEmojis = async (emojis: Emoji[]) => {
  await connectDB()

  if (!emojis.length) return { modifiedCount: 0, upsertedCount: 0 }

  const operations = emojis.map((e) => ({
    updateOne: {
      filter: { name: e.name },
      update: { $set: { emoji: e.emoji, name: e.name } },
      upsert: true
    }
  }))

  const result = await EmojiModel.bulkWrite(operations, { ordered: false })
  return result
}

// loop through random tags until 2 of the same season are found
export const getCurrentSeason = async (): Promise<number> => {
  const seasons: Record<number, number> = {}

  for (const tag of TAGS) {
    const [{ data: log, error: logError }, { data: race, error: raceError }] = await Promise.all([
      getRaceLog(tag),
      getRiverRace(tag)
    ])

    if (logError || !log || !log.length || !race || raceError) continue

    const { seasonId } = log[0]
    const { sectionIndex } = race

    const season = sectionIndex === 0 ? seasonId + 1 : seasonId

    if (season in seasons) {
      return season
    } else {
      seasons[season] = 1
    }
  }

  const seasonsAdded = Object.keys(seasons)

  if (!seasonsAdded.length) return -1

  return Number(seasonsAdded[0])
}

export const getEmoji = async (name: string) => {
  await connectDB()

  const emoji = await EmojiModel.findOne({ name }, { _id: 0 })

  return emoji
}

export const deleteDailyTrackingEntries = async (tag: string, entriesToRemove: PartialDailyTrackingEntry[]) => {
  await connectDB()

  const entryPullConditions = entriesToRemove.map(({ season, timestamp }) => ({
    $and: [{ season }, { timestamp }]
  }))

  const result = await PlusClanModel.updateOne(
    { tag: formatTag(tag, true) },
    {
      $pull: {
        dailyTracking: {
          $or: entryPullConditions
        }
      }
    }
  )

  return result
}

export const bulkAddDailyTrackingEntries = async (entries: FullDailyTrackingEntry[]) => {
  await connectDB()

  if (!entries.length) return { modifiedCount: 0 }

  const operations = entries.map((e) => ({
    updateOne: {
      filter: { tag: formatTag(e.tag, true) },
      update: {
        $push: {
          dailyTracking: {
            day: e.day,
            scores: e.scores,
            season: e.season,
            timestamp: new Date(e.timestamp),
            week: e.week
          }
        }
      }
    }
  }))

  const result = await PlusClanModel.bulkWrite(operations, { ordered: false })
  return result
}

export const setSeasonalReportSent = async (tag: string, reportSent: boolean) => {
  await connectDB()

  const result = await LinkedClanModel.updateOne(
    { tag: formatTag(tag, true) },
    {
      $set: {
        seasonalReportSent: reportSent
      }
    }
  )

  return result
}

export const resetSeasonalReportsSent = async () => {
  await connectDB()

  const result = await LinkedClanModel.updateMany(
    { seasonalReportSent: true },
    {
      $set: {
        seasonalReportSent: false
      }
    }
  )

  return result
}

export const setRisersAndFallers = async (risers: RiserFallerEntry[], fallers: RiserFallerEntry[]) => {
  await connectDB()

  const result = await StatisticsModel.updateOne(
    {},
    {
      $set: {
        fallers,
        risers
      }
    }
  )

  return result
}

export const setLbLastUpdated = async (timestamp: number) => {
  await connectDB()

  const result = await StatisticsModel.updateOne(
    {},
    {
      $set: {
        lbLastUpdated: timestamp
      }
    }
  )

  return result
}

export const resetDailyLeaderboardClans = async () => {
  await connectDB()

  const result = await DailyLeaderboardModel.updateMany(
    {},
    {
      $set: {
        crossedFinishLine: false,
        decksRemaining: 200,
        fameAvg: 0,
        isTraining: true,
        notRanked: false
      }
    }
  )

  return result
}

export const deletePlusClan = async (tag: string) => {
  await connectDB()

  const result = PlusClanModel.deleteOne({ tag: formatTag(tag, true) })

  return result
}

export const sliceGuildPlusFeatures = async (id: string) => {
  await connectDB()

  const linkedGuildClans = await getLinkedClansByGuild(id)

  const playerLimit = calcLinkedPlayerLimit(linkedGuildClans.length)
  const nudgeLimit = calcNudgeLimit(linkedGuildClans.length)

  const result = await GuildModel.updateOne(
    { guildID: id },
    {
      $push: {
        'nudges.links': { $each: [], $slice: playerLimit },
        'nudges.scheduled': { $each: [], $slice: nudgeLimit }
      }
    }
  )

  return { ...result, nudgeLimit, playerLimit }
}

export const deleteDailyLeaderboard = async () => {
  await connectDB()

  const result = await DailyLeaderboardModel.deleteMany({})

  return result
}

export const updateDailyLeaderboard = async (entries: DailyLeaderboardEntry[]) => {
  await connectDB()

  const result = await DailyLeaderboardModel.insertMany(entries)

  return result
}

export const getAllWarLogClanAttacks = async () => {
  await connectDB()

  const clanAttacks = await WarLogClanAttacksModel.find({}, { __v: 0, _id: 0 })

  return clanAttacks
}

export const deleteWarLogClanAttacks = async (tag: string) => {
  await connectDB()

  const result = WarLogClanAttacksModel.deleteOne({ tag: formatTag(tag, true) })

  return result
}

export const addWarLogClanAttacks = async ({ attacks, dayIndex, tag }: WarLogClanAttacksInput) => {
  await connectDB()

  const result = WarLogClanAttacksModel.insertOne({
    attacks,
    dayIndex,
    tag: formatTag(tag, true)
  })

  return result
}

export const addWarLogs = async (logs: WarLogInput[]) => {
  await connectDB()

  const result = WarLogModel.insertMany(logs, { ordered: false })

  return result
}

export const getWarLogExists = async (key: string) => {
  await connectDB()

  const logExists = await WarLogModel.exists({ key })

  return !!logExists
}

export const bulkUpdateWarLogClanAttacks = async (entries: WarLogClanAttacksInput[]) => {
  await connectDB()

  if (!entries.length) return { modifiedCount: 0 }

  const operations = entries.map((e) => ({
    updateOne: {
      filter: { tag: formatTag(e.tag, true) },
      update: {
        $set: {
          attacks: e.attacks,
          dayIndex: e.dayIndex
        }
      }
    }
  }))

  const result = await WarLogClanAttacksModel.bulkWrite(operations, { ordered: false })
  return result
}

export const bulkUpdateWarLogLastUpdated = async (entries: LastUpdatedInput[]) => {
  await connectDB()

  if (!entries.length) return { modifiedCount: 0 }

  const operations = entries.map((e) => ({
    updateOne: {
      filter: { tag: formatTag(e.tag, true) },
      update: {
        $set: {
          warLogsLastUpdated: new Date(e.timestamp)
        }
      }
    }
  }))

  const result = await ProClanModel.bulkWrite(operations, { ordered: false })
  return result
}

export const getAccount = async (userId: string) => {
  await connectDB()

  const account = await AccountModel.findOne({ providerAccountId: userId }, { __v: 0, _id: 0 }).lean()

  return account
}

export const setStripeCustomerId = async (userId: string, customerId: string) => {
  await connectDB()

  const result = await AccountModel.updateOne(
    { providerAccountId: userId },
    {
      $set: {
        stripeCustomerId: customerId
      }
    }
  )

  return result
}

export const addProClan = async ({ active, clanName, stripeId, tag }: ProClanInput) => {
  await connectDB()

  const formattedTag = formatTag(tag, true)

  // Use findOneAndUpdate with upsert to prevent race conditions and duplicate key errors
  const result = await ProClanModel.findOneAndUpdate(
    { tag: formattedTag },
    {
      $set: { active, clanName, stripeId, tag: formattedTag },
      $setOnInsert: {
        clanLogs: { enabled: false },
        warLogsEnabled: false,
        webhookUrl1: '',
        webhookUrl2: ''
      }
    },
    { new: true, upsert: true }
  )

  return result
}

export const deleteProClan = async (tag: string) => {
  await connectDB()

  const result = await ProClanModel.findOneAndDelete({ tag: formatTag(tag, true) })

  return result
}

export const deleteProClanByStripeId = async (stripeId: string) => {
  await connectDB()

  const result = await ProClanModel.findOneAndDelete({ stripeId })

  return result
}

export const getProClanByStripeId = async (stripeId: string) => {
  await connectDB()

  const proClan = await ProClanModel.findOne({ stripeId }, { _id: 0 })

  return proClan
}

export const setProClanStatus = async (tag: string, active: boolean) => {
  await connectDB()

  const result = await ProClanModel.updateOne(
    { tag: formatTag(tag, true) },
    {
      $set: {
        active
      }
    }
  )

  return result
}

export const getProClans = async (query: object) => {
  await connectDB()

  const proClans = await ProClanModel.find({ active: true, ...query }, { _id: 0 })

  return proClans
}

export const addPlusClan = async (tag: string) => {
  await connectDB()

  const formattedTag = formatTag(tag, true)

  const result = await PlusClanModel.findOneAndUpdate(
    { tag: formattedTag },
    { $set: { active: true, tag: formattedTag } },
    { new: true, upsert: true } // return the updated doc & create if not exists
  )

  return result
}

export const setPlusClanStatus = async (tag: string, active: boolean) => {
  await connectDB()

  const result = await PlusClanModel.updateOne(
    { tag: formatTag(tag, true) },
    {
      $set: {
        active
      }
    }
  )

  return result
}

export const getProClan = async (tag: string) => {
  await connectDB()

  const proClan = await ProClanModel.findOne({ tag: formatTag(tag, true) }, { _id: 0 })

  return proClan
}

export const setWarLogClan = async ({ tag, webhookUrl1, webhookUrl2 }: SetWarLogClanInput) => {
  await connectDB()

  const query: Record<string, string> = {}

  if (webhookUrl1) query.webhookUrl1 = webhookUrl1
  if (webhookUrl2) query.webhookUrl2 = webhookUrl2

  const result = await ProClanModel.updateOne(
    { tag: formatTag(tag, true) },
    {
      $set: {
        warLogsEnabled: true,
        warLogsTimestamp: Date.now(),
        ...query
      },
      $unset: {
        warLogsLastUpdated: 1
      }
    }
  )

  return result
}

export const setWarLogClanStatus = async (tag: string, enabled: boolean) => {
  await connectDB()

  const result = await ProClanModel.updateOne(
    { tag: formatTag(tag, true) },
    {
      $set: {
        warLogsEnabled: enabled
      }
    }
  )

  return result
}

export const setGuildTimezone = async (id: string, timezone: string) => {
  await connectDB()

  const result = await GuildModel.updateOne(
    { guildID: id },
    {
      $set: {
        timezone
      }
    }
  )

  return result
}

export const bulkUpdateClanLogs = async (entries: ClanLogsInput[]) => {
  await connectDB()

  if (!entries.length) return { modifiedCount: 0 }

  const operations = entries.map((e) => ({
    replaceOne: {
      filter: { tag: formatTag(e.tag, true) },
      replacement: e as any,
      upsert: true
    }
  }))

  const result = await ClanLogModel.bulkWrite(operations, { ordered: false })
  return result
}

export const getAllClanLogs = async () => {
  await connectDB()

  const entries = await ClanLogModel.find({}).lean()
  return entries
}

export const bulkUpdateClanLogLastUpdated = async (entries: LastUpdatedInput[]) => {
  await connectDB()

  if (!entries.length) return { modifiedCount: 0 }

  const operations = entries.map((e) => ({
    updateOne: {
      filter: { tag: formatTag(e.tag, true) },
      update: {
        $set: {
          'clanLogs.lastUpdated': e.timestamp
        }
      }
    }
  }))

  const result = await ProClanModel.bulkWrite(operations, { ordered: false })
  return result
}

export const setClanLogClanStatus = async (tag: string, enabled: boolean) => {
  await connectDB()

  const result = await ProClanModel.updateOne(
    { tag: formatTag(tag, true) },
    {
      $set: {
        'clanLogs.enabled': enabled
      }
    }
  )

  return result
}

export const deleteClanLogEntry = async (tag: string) => {
  await connectDB()

  const result = ClanLogModel.deleteOne({ tag: formatTag(tag, true) })

  return result
}

export const setClanLogClan = async ({ tag, webhookUrl1, webhookUrl2 }: SetWarLogClanInput) => {
  await connectDB()

  const setQuery: Record<string, unknown> = {
    'clanLogs.enabled': true,
    'clanLogs.timestamp': Date.now()
  }

  if (webhookUrl1) setQuery['clanLogs.webhookUrl1'] = webhookUrl1
  if (webhookUrl2) setQuery['clanLogs.webhookUrl2'] = webhookUrl2

  const result = await ProClanModel.updateOne(
    { tag: formatTag(tag, true) },
    {
      $set: setQuery,
      $unset: { 'clanLogs.lastUpdated': 1 }
    }
  )

  return result
}

export const setSeasonalReport = async (id: string, tag: string, enabled: boolean, channelId?: string) => {
  await connectDB()

  const updateQuery: Record<string, unknown> = {
    seasonalReportEnabled: enabled
  }

  if (channelId) {
    updateQuery.seasonalReportChannelId = channelId
  }

  const query = await LinkedClanModel.updateOne(
    { guildID: id, tag: formatTag(tag, true) },
    {
      $set: updateQuery
    }
  )

  return query
}

export const setWarReport = async (id: string, tag: string, enabled: boolean, channelId?: string) => {
  await connectDB()

  const updateQuery: Record<string, unknown> = {
    warReportEnabled: enabled
  }

  if (channelId) {
    updateQuery.warReportChannelId = channelId
  }

  const query = await LinkedClanModel.updateOne(
    { guildID: id, tag: formatTag(tag, true) },
    {
      $set: updateQuery
    }
  )

  return query
}

// ================== Webhook Idempotency ==================

/**
 * Check if a webhook event has already been processed
 * @param eventId - Stripe event ID
 * @returns true if event was already processed
 */
export const isWebhookEventProcessed = async (eventId: string): Promise<boolean> => {
  await connectDB()

  const existing = await WebhookEventModel.findOne({ eventId })
  return !!existing
}

/**
 * Mark a webhook event as processed
 * @param eventId - Stripe event ID
 * @param eventType - Type of event (e.g., customer.subscription.created)
 * @param metadata - Optional metadata to store
 */
export const markWebhookEventProcessed = async (
  eventId: string,
  eventType: string,
  metadata?: Record<string, unknown>
) => {
  await connectDB()

  await WebhookEventModel.create({
    eventId,
    eventType,
    metadata,
    processedAt: new Date()
  })
}
