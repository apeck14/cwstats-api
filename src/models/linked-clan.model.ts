import mongoose, { Document, Model, Schema } from 'mongoose'

export interface LinkedClan extends Document {
  clanBadge: string
  clanName: string
  discordInviteCode?: string
  guildID: string
  isPro?: boolean
  seasonalReportChannelId?: string
  seasonalReportEnabled: boolean
  seasonalReportSent: boolean
  tag: string
  warReportChannelId?: string
  warReportEnabled: boolean
}

const linkedClanSchema = new Schema<LinkedClan>(
  {
    clanBadge: { required: true, type: String },
    clanName: { required: true, type: String },
    discordInviteCode: { type: String },
    guildID: { required: true, type: String },
    isPro: { default: false, type: Boolean },
    seasonalReportChannelId: { type: String },
    seasonalReportEnabled: { required: true, type: Boolean },
    seasonalReportSent: { required: true, type: Boolean },
    tag: { required: true, trim: true, type: String, unique: true },
    warReportChannelId: { type: String },
    warReportEnabled: { required: true, type: Boolean }
  },
  { collection: 'Linked Clans', versionKey: false }
)

export const LinkedClanModel: Model<LinkedClan> =
  mongoose.models.LinkedClan || mongoose.model<LinkedClan>('LinkedClan', linkedClanSchema)
