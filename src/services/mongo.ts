import { FilterQuery } from 'mongoose'

import { connectDB } from '@/config/db'
import { formatTag } from '@/lib/format'
import { DailyLeaderboard, DailyLeaderboardModel } from '@/models/daily-leaderboard.model'
import { EmojiModel } from '@/models/emoji.model'
import { GuildModel } from '@/models/guild.model'
import { LinkedAccountModel } from '@/models/linked-account.model'
import { LinkedClan, LinkedClanModel } from '@/models/linked-clan.model'
import { PlayerModel } from '@/models/player.model'
import { PlusClan, PlusClanModel } from '@/models/plus-clan.model'
import { StatisticsModel } from '@/models/statistics.model'
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

interface DeleteWebhookInput {
  tag: string
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
}

interface FullDailyTrackingEntry {
  tag: string
  day: number
  week: number
  season: number
  timestamp: string
  scores: DailyTrackingEntryScore[]
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
export function getAllPlusClans(tagsOnly: true): Promise<string[]>
export function getAllPlusClans(tagsOnly: false): Promise<PlusClan[]>
export function getAllPlusClans(tagsOnly: boolean): Promise<string[] | PlusClan[]>
export async function getAllPlusClans(tagsOnly: boolean): Promise<string[] | PlusClan[]> {
  await connectDB()

  const plusClans = await PlusClanModel.find({}, { _id: 0 }).lean()

  if (tagsOnly) {
    return plusClans.map((doc) => doc.tag)
  }

  return plusClans
}

export const getGuild = async (id: string, limited?: boolean) => {
  await connectDB()

  const projection = limited ? { _id: 0, nudges: 0 } : { _id: 0 }

  const guild = await GuildModel.findOne({ guildID: id }, { ...projection }).lean()

  return guild
}

export const getLinkedClansByGuild = async (id: string): Promise<LinkedClan[]> => {
  await connectDB()

  const linkedClans = await LinkedClanModel.find({ guildID: id }, { _id: 0 }).lean()

  return linkedClans
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

  const dailyLb = await DailyLeaderboardModel.find(query)
    .sort({
      notRanked: 1,
      // eslint-disable-next-line perfectionist/sort-objects
      fameAvg: -1,
      rank: 1,
    })
    .limit(limit || 0)

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

export const deleteWebhook = async ({ tag }: DeleteWebhookInput) => {
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
