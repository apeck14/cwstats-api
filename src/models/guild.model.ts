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

export interface FreeWarLogClan {
  tag: string
  timestamp: Date
  webhookUrl: string
}

export interface Nudges {
  ignoreLeaders: boolean
  ignoreWhenCrossedFinishLine: boolean
  links: LinkedPlayer[]
  message: string
  scheduled: ScheduledNudge[]
  updateNicknameUponLinking?: boolean
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
  freeWarLogClan?: FreeWarLogClan
}

const abbrSchema = new Schema(
  {
    abbr: { required: true, type: String },
    name: { required: true, type: String },
    tag: { required: true, type: String },
  },
  { _id: false },
)

const channelSchema = new Schema(
  {
    applicationsChannelID: { default: '', type: String },
    applyChannelID: { default: '', type: String },
    commandChannelIDs: { default: [], type: [String] },
  },
  { _id: false },
)

const defaultClanSchema = new Schema(
  {
    name: { required: true, type: String },
    tag: { required: true, type: String },
  },
  { _id: false },
)

const linkedPlayerSchema = new Schema(
  {
    discordID: { required: true, type: String },
    name: { required: true, type: String },
    tag: { required: true, type: String },
  },
  { _id: false },
)

const scheduledNudgeSchema = new Schema(
  {
    channelID: { required: true, type: String },
    clanName: { required: true, type: String },
    clanTag: { required: true, type: String },
    scheduledHourUTC: { required: true, type: Number },
  },
  { _id: false },
)

const nudgesSchema = new Schema(
  {
    ignoreLeaders: { default: false, type: Boolean },
    ignoreWhenCrossedFinishLine: { default: false, type: Boolean },
    links: { default: [], type: [linkedPlayerSchema] },
    message: { default: '', type: String },
    scheduled: { default: [], type: [scheduledNudgeSchema] },
  },
  { _id: false },
)

const freeWarLogClanSchema = new Schema(
  {
    lastUpdated: { required: false, type: Date }, // set when clan logs are updated
    tag: { required: false, type: String },
    timestamp: { required: true, type: Date }, // when webhookUrl was set
    webhookUrl: { required: false, type: String },
  },
  { _id: false },
)

const guildSchema = new Schema<Guild>(
  {
    abbreviations: { default: [], type: [abbrSchema] },
    adminRoleID: { type: String },
    channels: { default: {}, required: true, type: channelSchema },
    cooldowns: { of: Date, type: Map },
    defaultClan: { type: defaultClanSchema },
    discordInviteCode: { type: String },
    freeWarLogClan: { default: {}, required: false, type: freeWarLogClanSchema },
    guildID: { required: true, type: String, unique: true },
    nudges: { type: nudgesSchema },
  },
  { collection: 'Guilds' },
)

export const GuildModel: Model<Guild> = mongoose.models.Guild || mongoose.model<Guild>('Guild', guildSchema)
