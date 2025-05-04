import { connectDB } from '../config/db'
import { PlayerModel } from '../models/player.model'

interface PlayerInput {
  tag: string
  name: string
  clanName?: string
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
