import mongoose, { Model, Schema } from 'mongoose'

export interface SavedClan {
  name: string
  tag: string
  badge: string
}

export interface SavedPlayer {
  name: string
  tag: string
}

export interface LinkedAccount extends Document {
  discordID: string
  tag: string
  savedClans: SavedClan[]
  savedPlayers: SavedPlayer[]
}

const savedClanSchema = new Schema<SavedClan>(
  {
    badge: { required: true, type: String },
    name: { required: true, type: String },
    tag: { required: true, type: String }
  },
  { _id: false }
)

const savedPlayerSchema = new Schema<SavedPlayer>(
  {
    name: { required: true, type: String },
    tag: { required: true, type: String }
  },
  { _id: false }
)

const linkedAccountSchema = new Schema<LinkedAccount>(
  {
    discordID: { required: true, type: String, unique: true },
    savedClans: {
      type: [savedClanSchema],
      validate: {
        message: 'Duplicate clan tags are not allowed.',
        validator: (arr: SavedClan[]) => {
          const tags = arr.map((c) => c.tag)
          return new Set(tags).size === tags.length
        }
      }
    },
    savedPlayers: {
      type: [savedPlayerSchema],
      validate: {
        message: 'Duplicate player tags are not allowed.',
        validator: (arr: SavedPlayer[]) => {
          const tags = arr.map((p) => p.tag)
          return new Set(tags).size === tags.length
        }
      }
    },
    tag: { required: true, type: String }
  },
  { collection: 'Linked Accounts', versionKey: false }
)

export const LinkedAccountModel: Model<LinkedAccount> =
  mongoose.models.LinkedAccount || mongoose.model<LinkedAccount>('LinkedAccount', linkedAccountSchema)
