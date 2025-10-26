import mongoose, { Document, Model, Schema } from 'mongoose'

export interface ClanLogMember {
  tag: string
  name: string
  role: string
  level: number
}

interface ClanLog extends Document {
  tag: string
  badge: string
  type: string
  description: string
  clanWarTrophies: number
  locationId: number
  requiredTrophies: number
  members: ClanLogMember[]
}

const MemberSchema = new Schema<ClanLogMember>(
  {
    level: { required: true, type: Number },
    name: { required: true, type: String },
    role: { required: true, type: String },
    tag: { required: true, type: String }
  },
  { _id: false }
)

const ClanLogSchema = new Schema<ClanLog>(
  {
    badge: { required: true, type: String },
    clanWarTrophies: { required: true, type: Number },
    description: { required: true, type: String },
    locationId: { required: true, type: Number },
    members: { required: true, type: [MemberSchema] },
    requiredTrophies: { required: true, type: Number },
    tag: { required: true, type: String },
    type: { required: true, type: String }
  },
  { collection: 'Clan Logs', versionKey: false }
)

export const ClanLogModel: Model<ClanLog> = mongoose.models.ClanLog || mongoose.model<ClanLog>('ClanLog', ClanLogSchema)
