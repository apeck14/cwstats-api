import mongoose, { Document, Model, Schema } from 'mongoose'

interface WarLog extends Document {
  timestamp: Date
  tag: string
}

const WarLogSchema = new Schema<WarLog>(
  {
    tag: { required: true, trim: true, type: String },
    timestamp: { required: true, type: Date },
  },
  { collection: 'War Logs' },
)

export const WarLogModel: Model<WarLog> =
  mongoose.models.WarLog || mongoose.model<WarLog>('WarLog', WarLogSchema)
