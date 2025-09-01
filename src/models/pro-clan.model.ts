import mongoose, { Document, Model, Schema } from 'mongoose'

export interface ProClan extends Document {
  tag: string
  clanName: string
  active: boolean
  webhookUrl1: string
  webhookUrl2: string
  stripeId: string
}

const proClanSchema = new Schema<ProClan>(
  {
    active: { default: true, required: true, type: Boolean },
    clanName: { required: true, type: String },
    stripeId: { required: true, type: String },
    tag: { required: true, trim: true, type: String, unique: true },
    webhookUrl1: { default: '', required: true, type: String },
    webhookUrl2: { default: '', required: true, type: String },
  },
  { collection: 'CWStats Pro' },
)

export const ProClanModel: Model<ProClan> =
  mongoose.models.ProClan || mongoose.model<ProClan>('ProClan', proClanSchema)
