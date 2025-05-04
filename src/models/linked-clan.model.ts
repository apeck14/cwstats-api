import mongoose, { Document, Model, Schema } from 'mongoose'

export interface LinkedClan extends Document {
  clanBadge: string
  clanName: string
  discordInviteCode?: string
  guildID: string
  seasonalReportEnabled: boolean
  seasonalReportSent: boolean
  tag: string
  warReportEnabled: boolean
  webhookUrl?: string
}

const linkedClanSchema = new Schema<LinkedClan>(
  {
    clanBadge: { required: true, type: String },
    clanName: { required: true, type: String },
    discordInviteCode: { type: String },
    guildID: { required: true, type: String },
    seasonalReportEnabled: { required: true, type: Boolean },
    seasonalReportSent: { required: true, type: Boolean },
    tag: { required: true, trim: true, type: String, unique: true },
    warReportEnabled: { required: true, type: Boolean },
    webhookUrl: {
      type: String,
      validate: {
        message: 'webhookUrl must include "https://discord.com"',
        validator: (value: string) => !value || value.includes('https://discord.com'),
      },
    },
  },
  { collection: 'Linked Clans' },
)

export const LinkedClanModel: Model<LinkedClan> =
  mongoose.models.LinkedClan || mongoose.model<LinkedClan>('LinkedClan', linkedClanSchema)
