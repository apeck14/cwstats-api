import mongoose, { Document, Model, Schema } from 'mongoose'

export interface ProClan extends Document {
  tag: string
  clanName: string
  active: boolean
  webhookUrl1?: string
  webhookUrl2?: string
  stripeId: string
  warLogsLastUpdated?: Date
  warLogsTimestamp?: Date
  warLogsEnabled: boolean
}

const proClanSchema = new Schema<ProClan>(
  {
    active: { default: true, required: true, type: Boolean },
    clanName: { required: true, type: String },
    stripeId: { required: true, type: String },
    tag: { required: true, trim: true, type: String, unique: true },
    warLogsEnabled: { default: false, required: true, type: Boolean },
    warLogsLastUpdated: { type: Date }, // last time logs were udpated
    warLogsTimestamp: { type: Date }, // when webhooks were created
    webhookUrl1: { default: '', type: String },
    webhookUrl2: { default: '', type: String },
  },
  { collection: 'CWStats Pro', versionKey: false },
)

export const ProClanModel: Model<ProClan> =
  mongoose.models.ProClan || mongoose.model<ProClan>('ProClan', proClanSchema)
