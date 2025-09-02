import mongoose, { Document, Model, Schema } from 'mongoose'

export interface Player extends Document {
  tag: string
  name: string
  clanName: string
}

const playerSchema = new Schema<Player>(
  {
    clanName: { default: '', type: String },
    name: { required: true, type: String },
    tag: { required: true, trim: true, type: String }, // don't add unique index, calls to add player are non-blocking (performance isn't priority)
  },
  { collection: 'Players', versionKey: false },
)

export const PlayerModel: Model<Player> =
  mongoose.models.Player || mongoose.model<Player>('Player', playerSchema)
