import mongoose, { Document, Model, Schema } from 'mongoose'

interface WarLogClanAttacks extends Document {
  tag: string
  attacks: Record<string, number>
  dayIndex: number
}

const WarLogClanAttacksSchema = new Schema<WarLogClanAttacks>(
  {
    attacks: {
      default: {},
      of: Number,
      required: true,
      type: Map
    },
    dayIndex: { required: true, type: Number },
    tag: { required: true, trim: true, type: String }
  },
  { collection: 'War Log Clan Attacks', versionKey: false }
)

export const WarLogClanAttacksModel: Model<WarLogClanAttacks> =
  mongoose.models.WarLogClanAttacks || mongoose.model<WarLogClanAttacks>('WarLogClanAttacks', WarLogClanAttacksSchema)
