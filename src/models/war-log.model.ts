import mongoose, { Document, Model, Schema } from 'mongoose'

interface WarLog extends Document {
  key: string
  tag: string
  timestamp: Date
}

const WarLogSchema = new Schema<WarLog>(
  {
    key: { required: true, type: String, unique: true }, // ABC1234_20250723T081032.000Z
    tag: { required: true, trim: true, type: String },
    timestamp: { required: true, type: Date }
  },
  { collection: 'War Logs', versionKey: false }
)

export const WarLogModel: Model<WarLog> = mongoose.models.WarLog || mongoose.model<WarLog>('WarLog', WarLogSchema)
