import { FilterQuery, ProjectionType } from 'mongoose'

import { connectDB } from '@/config/db'
import { formatTag } from '@/lib/format'
import { calcLinkedPlayerLimit, calcNudgeLimit } from '@/lib/utils'
import { AccountModel } from '@/models/accounts.model'
import {
  DailyLeaderboard,
  DailyLeaderboardEntry,
  DailyLeaderboardModel,
} from '@/models/daily-leaderboard.model'
import { EmojiModel } from '@/models/emoji.model'
import { Guild, GuildModel } from '@/models/guild.model'
import { LinkedAccountModel } from '@/models/linked-account.model'
import { LinkedClan, LinkedClanModel } from '@/models/linked-clan.model'
import { PlayerModel } from '@/models/player.model'
import { PlusClan, PlusClanModel } from '@/models/plus-clan.model'
import { Location, StatisticsModel } from '@/models/statistics.model'
import { WarLogModel } from '@/models/war-log.model'
import { WarLogClanAttacksModel } from '@/models/war-log-clan-attacks.model'
import { getRaceLog, getRiverRace } from '@/services/supercell'

interface PlayerInput {
  tag: string
  name: string
  clanName?: string
}

interface LinkPlayerInput {
  tag: string
  userId: string
  name: string
}

interface CommandCooldownInput {
  id: string
  commandName: string
  delay: number
}

interface DailyLeaderboardInput {
  name?: string
  limit: number
  maxTrophies: number
  minTrophies: number
}

interface NudgeLinkInput {
  name: string
  tag: string
  userId: string
  guildId: string
}

interface DeleteNudgeLinkInput {
  guildId: string
  tag: string
}

interface DeleteNudgeInput {
  guildId: string
  tag: string
  scheduledHourUTC: number
}

interface Emoji {
  name: string
  emoji: string
}

interface PartialDailyTrackingEntry {
  season: number
  timestamp: string
}

interface DailyTrackingEntryScore {
  attacks: number
  fame: number
  name: string
  tag: string
  missed: boolean
  notInClan?: boolean
}

interface FullDailyTrackingEntry {
  tag: string
  day: number
  week: number
  season: number
  timestamp: string
  scores: DailyTrackingEntryScore[]
}

interface HourlyTrackingEntry {
  tag: string
  attacksCompleted: number
  avg: number
  day: number
  season: number
  week: number
  timestamp: string
  lastHourAvg: number
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

interface FreeWarLogClanInput {
  tag: string
  webhookUrl1: string | undefined
  webhookUrl2: string | undefined
  isCreation: boolean
  guildId: string
}

interface WarLogInput {
  timestamp: Date
  tag: string
}

interface WarLogClanAttacksInput {
  tag: string
  attacks: Record<string, number>
  dayIndex: number
}

interface LastUpdatedInput {
  tag: string
  timestamp: number
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
  '#98RVLCUY',
]

export const addPlayer = async ({ clanName, name, tag }: PlayerInput) => {
  await connectDB()

  const updatedPlayer = await PlayerModel.findOneAndUpdate(
    { tag },
    { clanName, name, tag },
    { new: true, setDefaultsOnInsert: true, upsert: true },
  )

  if (!updatedPlayer) {
    throw new Error('Player was not added or updated.')
  }

  return updatedPlayer
}

export const linkPlayer = async ({ name, tag, userId }: LinkPlayerInput) => {
  await connectDB()

  const account = await LinkedAccountModel.updateOne(
    { discordID: userId },
    {
      $set: { tag },
      $setOnInsert: { savedPlayers: [{ name, tag }] },
    },
    { upsert: true },
  )

  return account
}

// set function overloading for typescript
export function getPlusClans(tagsOnly: true, query: object, projection: object): Promise<string[]>
export function getPlusClans(tagsOnly: false, query: object, projection: object): Promise<PlusClan[]>
export function getPlusClans(
  tagsOnly: boolean,
  query: object,
  projection: object,
): Promise<string[] | PlusClan[]>
export async function getPlusClans(
  tagsOnly: boolean,
  query: object,
  projection: object,
): Promise<string[] | PlusClan[]> {
  await connectDB()

  const plusClans = await PlusClanModel.find({ ...query }, { _id: 0, ...projection }).lean()

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

  const linkedClans = await LinkedClanModel.find({ guildID: id }, { _id: 0 }).lean()

  return linkedClans
}

export const getLinkedClan = async (tag: string): Promise<LinkedClan | null> => {
  await connectDB()

  const linkedClan = await LinkedClanModel.findOne({ tag: formatTag(tag, true) }, { _id: 0 }).lean()

  return linkedClan
}

export const getAllLinkedClans = async (): Promise<LinkedClan[]> => {
  await connectDB()

  const linkedClans = await LinkedClanModel.find({}, { _id: 0 }).lean()

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
        [`cooldowns.${commandName}`]: now,
      },
    },
  )

  return query
}

export const getDailyLeaderboard = async ({
  limit,
  maxTrophies,
  minTrophies,
  name,
}: DailyLeaderboardInput) => {
  await connectDB()

  const query: FilterQuery<DailyLeaderboard> = {
    clanScore: {
      ...(minTrophies ? { $gte: minTrophies } : {}),
      ...(maxTrophies ? { $lte: maxTrophies } : {}),
    },
  }

  // if no name provided, assume global (all clans)
  if (name) query['location.name'] = name

  const dailyLb = await DailyLeaderboardModel.aggregate([
    { $match: query },
    {
      $addFields: {
        rankNull: { $cond: [{ $eq: ['$rank', null] }, 1, 0] },
      },
    },
    {
      $sort: {
        notRanked: 1, // ranked first
        // eslint-disable-next-line perfectionist/sort-objects
        fameAvg: -1, // fame descending
        rankNull: 1, // non-null ranks first
        // eslint-disable-next-line perfectionist/sort-objects
        rank: 1, // then sort by rank ascending
      },
    },
    ...(limit ? [{ $limit: limit }] : []),
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
      'nudges.links.tag': { $ne: tag }, // Only update if no existing link with this tag
    },
    {
      $push: {
        'nudges.links': {
          discordID: userId,
          name,
          tag,
        },
      },
    },
  )

  return result
}

export const deleteNudgeLink = async ({ guildId, tag }: DeleteNudgeLinkInput) => {
  await connectDB()

  const result = await GuildModel.updateOne(
    { guildID: guildId },
    {
      $pull: {
        'nudges.links': { tag },
      },
    },
  )

  return result
}

export const deleteNudge = async ({ guildId, scheduledHourUTC, tag }: DeleteNudgeInput) => {
  await connectDB()

  const result = await GuildModel.updateOne(
    { guildID: guildId },
    {
      $pull: {
        'nudges.scheduled': { clanTag: tag, scheduledHourUTC },
      },
    },
  )

  return result
}

export const deleteWebhook = async (tag: string) => {
  await connectDB()

  const linkedClan = await LinkedClanModel.findOneAndUpdate(
    { tag: formatTag(tag, true) },
    {
      $unset: {
        webhookUrl: 1,
      },
    },
  )

  return linkedClan
}

export const createGuild = async (guildId: string) => {
  await connectDB()

  const result = await GuildModel.updateOne(
    { guildID: guildId },
    { $setOnInsert: { guildID: guildId } },
    { upsert: true },
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
      upsert: true,
    },
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
      getRiverRace(tag),
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

export const deleteDailyTrackingEntries = async (
  tag: string,
  entriesToRemove: PartialDailyTrackingEntry[],
) => {
  await connectDB()

  const entryPullConditions = entriesToRemove.map(({ season, timestamp }) => ({
    $and: [{ season }, { timestamp }],
  }))

  const result = await PlusClanModel.updateOne(
    { tag: formatTag(tag, true) },
    {
      $pull: {
        dailyTracking: {
          $or: entryPullConditions,
        },
      },
    },
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
            timestamp: e.timestamp,
            week: e.week,
          },
        },
      },
    },
  }))

  const result = await PlusClanModel.bulkWrite(operations, { ordered: false })
  return result
}

export const bulkAddHourlyTrackingEntries = async (entries: HourlyTrackingEntry[]) => {
  await connectDB()

  if (!entries.length) return { modifiedCount: 0 }

  const operations = entries.map((e) => ({
    updateOne: {
      filter: { tag: formatTag(e.tag, true) },
      update: {
        $push: {
          hourlyAverages: {
            $each: [
              {
                attacksCompleted: e.attacksCompleted,
                avg: e.avg,
                day: e.day,
                lastHourAvg: e.lastHourAvg,
                season: e.season,
                timestamp: e.timestamp,
                week: e.week,
              },
            ],
            $slice: -300,
          },
        },
      },
    },
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
        seasonalReportSent: reportSent,
      },
    },
  )

  return result
}

export const resetSeasonalReportsSent = async () => {
  await connectDB()

  const result = await LinkedClanModel.updateMany(
    { seasonalReportSent: true },
    {
      $set: {
        seasonalReportSent: false,
      },
    },
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
        risers,
      },
    },
  )

  return result
}

export const setFreeWarLogClan = async ({ guildId, tag, webhookUrl1, webhookUrl2 }: FreeWarLogClanInput) => {
  await connectDB()

  const formattedTag = formatTag(tag, true)

  const query: Record<string, number | string | undefined> = {
    'freeWarLogClan.tag': formattedTag,
    'freeWarLogClan.timestamp': Date.now(),
    'freeWarLogClan.webhookUrl1': webhookUrl1,
    'freeWarLogClan.webhookUrl2': webhookUrl2,
  }

  const result = await GuildModel.updateOne(
    { guildID: guildId },
    {
      $set: {
        ...query,
      },
      $unset: {
        'freeWarLogClan.lastUpdated': 1, // used in cron job
      },
    },
  )

  return result
}

export const setLbLastUpdated = async (timestamp: number) => {
  await connectDB()

  const result = await StatisticsModel.updateOne(
    {},
    {
      $set: {
        lbLastUpdated: timestamp,
      },
    },
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
        notRanked: false,
      },
    },
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
        'nudges.scheduled': { $each: [], $slice: nudgeLimit },
      },
    },
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

export const searchPlayersByName = async (name: string, limit = 10) => {
  await connectDB()

  const players = await PlayerModel.aggregate([
    {
      $search: {
        compound: {
          should: [
            {
              // 1️⃣ Prioritize in-order prefix matches
              autocomplete: {
                path: 'name',
                query: name,
                score: { boost: { value: 5 } },
              },
            },
            {
              // 2️⃣ Strongly boost exact/full phrase matches
              phrase: {
                path: 'name',
                query: name,
                score: {
                  boost: { value: 10 },
                },
              },
            },
          ],
        },
        index: `${process.env.NODE_ENV === 'development' ? 'dev-' : ''}searchPlayerNames`,
      },
    },
    {
      $addFields: {
        score: { $meta: 'searchScore' },
      },
    },
    { $limit: limit },
    {
      $project: {
        __v: 0,
        _id: 0,
      },
    },
  ])

  return players
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
    tag: formatTag(tag, true),
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
          dayIndex: e.dayIndex,
        },
      },
    },
  }))

  const result = await WarLogClanAttacksModel.bulkWrite(operations, { ordered: false })
  return result
}

export const deleteGuildFreeWarLogClan = async (tag: string) => {
  await connectDB()

  const result = await GuildModel.updateOne(
    { 'freeWarLogClan.tag': formatTag(tag, true) },
    {
      $unset: {
        'freeWarLogClan.lastUpdated': 1,
        'freeWarLogClan.tag': 1,
        'freeWarLogClan.webhookUrl1': 1,
        'freeWarLogClan.webhookUrl2': 1,
      },
    },
  )

  return result
}

export const bulkUpdateWarLogLastUpdated = async (entries: LastUpdatedInput[]) => {
  await connectDB()

  if (!entries.length) return { modifiedCount: 0 }

  const operations = entries.map((e) => ({
    updateOne: {
      filter: { 'freeWarLogClan.tag': formatTag(e.tag, true) },
      update: {
        $set: {
          'freeWarLogClan.lastUpdated': e.timestamp,
        },
      },
    },
  }))

  const result = await GuildModel.bulkWrite(operations, { ordered: false })
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
        stripeCustomerId: customerId,
      },
    },
  )
  return result
}
