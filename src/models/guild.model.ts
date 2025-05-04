import mongoose, { Document, Model, Schema } from 'mongoose'

export interface Abbreviation {
  abbr: string
  name: string
  tag: string
}

export interface ChannelConfig {
  applicationsChannelID: string
  applyChannelID: string
  commandChannelIDs: string[]
}

export interface DefaultClan {
  name: string
  tag: string
}

export interface LinkedPlayer {
  discordID: string
  name: string
  tag: string
}

export interface ScheduledNudge {
  channelID: string
  clanName: string
  clanTag: string
  scheduledHourUTC: number
}

export interface Nudges {
  ignoreLeaders: boolean
  ignoreWhenCrossedFinishLine: boolean
  links: LinkedPlayer[]
  message: string
  scheduled: ScheduledNudge[]
}

export interface Guild extends Document {
  abbreviations: Abbreviation[]
  adminRoleID?: string
  channels: ChannelConfig
  cooldowns?: Map<string, Date>
  defaultClan?: DefaultClan
  discordInviteCode?: string
  guildID: string
  nudges?: Nudges
}

const abbrSchema = new Schema({
  abbr: { required: true, type: String },
  name: { required: true, type: String },
  tag: { required: true, type: String },
})

const channelSchema = new Schema({
  applicationsChannelID: { default: '', type: String },
  applyChannelID: { default: '', type: String },
  commandChannelIDs: { default: [], type: [String] },
})

const defaultClanSchema = new Schema({
  name: { required: true, type: String },
  tag: { required: true, type: String },
})

const linkedPlayerSchema = new Schema({
  discordID: { required: true, type: String },
  name: { required: true, type: String },
  tag: { required: true, type: String },
})

const scheduledNudgeSchema = new Schema({
  channelID: { required: true, type: String },
  clanName: { required: true, type: String },
  clanTag: { required: true, type: String },
  scheduledHourUTC: { required: true, type: Number },
})

const nudgesSchema = new Schema({
  ignoreLeaders: { default: false, type: Boolean },
  ignoreWhenCrossedFinishLine: { default: false, type: Boolean },
  links: { default: [], type: [linkedPlayerSchema] },
  message: { default: '', type: String },
  scheduled: { default: [], type: [scheduledNudgeSchema] },
})

const guildSchema = new Schema<Guild>(
  {
    abbreviations: { default: [], type: [abbrSchema] },
    adminRoleID: { type: String },
    channels: { required: true, type: channelSchema },
    cooldowns: { of: Date, type: Map },
    defaultClan: { type: defaultClanSchema },
    discordInviteCode: { type: String },
    guildID: { required: true, type: String, unique: true },
    nudges: { type: nudgesSchema },
  },
  { collection: 'Guilds' },
)

export const GuildModel: Model<Guild> = mongoose.models.Guild || mongoose.model<Guild>('Guild', guildSchema)
