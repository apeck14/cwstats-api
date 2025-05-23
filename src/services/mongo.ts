import { FilterQuery } from 'mongoose'

import { connectDB } from '@/config/db'
import { DailyLeaderboard, DailyLeaderboardModel } from '@/models/daily-leaderboard.model'
import { GuildModel } from '@/models/guild.model'
import { LinkedAccountModel } from '@/models/linked-account.model'
import { LinkedClanModel } from '@/models/linked-clan.model'
import { PlayerModel } from '@/models/player.model'
import { PlusClanModel } from '@/models/plus-clan.model'
import { StatisticsModel } from '@/models/statistics.model'

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

  const account = await LinkedAccountModel.findOneAndUpdate(
    { discordID: userId },
    {
      $set: { tag }, // update tag every time
      $setOnInsert: { savedPlayers: [{ name, tag }] }, // only if inserting new document
    },
    {
      new: true, // return the updated (or created) document
      upsert: true, // create if not found
    },
  )

  return account
}

export const getAllPlusClans = async (tagsOnly: boolean) => {
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

export const getLinkedClansByGuild = async (id: string) => {
  await connectDB()

  const linkedClans = await LinkedClanModel.find({ guildID: id }, { _id: 0 }).lean()

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
