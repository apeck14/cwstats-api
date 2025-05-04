import mongoose, { Document, Model, Schema } from 'mongoose'

export interface Player extends Document {
  tag: string
  name: string
  clanName: string
}

const playerSchema = new Schema<Player>({
  clanName: { default: '', type: String },
  name: { required: true, type: String },
  tag: { required: true, type: String }, // don't add unique index, calls to add player are non-blocking (performance isn't priority)
})

export const PlayerModel: Model<Player> =
  mongoose.models.Players || mongoose.model<Player>('Players', playerSchema)
