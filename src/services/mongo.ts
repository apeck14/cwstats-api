import { connectDB } from '../config/db'
import { GuildModel } from '../models/guild.model'
import { LinkedClanModel } from '../models/linked-clan.model'
import { PlayerModel } from '../models/player.model'
import { PlusClanModel } from '../models/plus-clan.model'

interface PlayerInput {
  tag: string
  name: string
  clanName?: string
}

interface CommandCooldownInput {
  id: string
  commandName: string
  delay: number
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

export const getAllPlusClans = async (tagsOnly: boolean) => {
  await connectDB()

  const plusClans = await PlusClanModel.find({}, { _id: 0 }).lean()

  if (tagsOnly) {
    return plusClans.map((doc) => doc.tag)
  }

  return plusClans
}

export const getGuild = async (id: string) => {
  await connectDB()

  const guild = await GuildModel.findOne({ guildID: id }, { _id: 0 }).lean()

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

  await GuildModel.updateOne(
    { guildID: id },
    {
      $set: {
        [`cooldowns.${commandName}`]: now,
      },
    },
  )
}
