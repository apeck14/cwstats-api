import mongoose, { Document, Model, Schema } from 'mongoose'

export interface Emoji extends Document {
  name: string
  emoji: string
}

const emojiSchema = new Schema<Emoji>(
  {
    emoji: { required: true, type: String },
    name: { required: true, type: String, unique: true }
  },
  { collection: 'Emojis', versionKey: false }
)

export const EmojiModel: Model<Emoji> = mongoose.models.Emoji || mongoose.model<Emoji>('Emoji', emojiSchema)
