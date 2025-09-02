import mongoose, { Document, Model, Schema } from 'mongoose'

export interface Location {
  id: number
  name: string
  isCountry: boolean
  countryCode?: string
}

interface ClanMovement {
  tag: string
  name: string
  rank: number
  previousRank: number
  location: Location
  clanScore: number
  members: number
  badgeId: number
}

interface Statistics extends Document {
  lbLastUpdated: number
  fallers: ClanMovement[]
  risers: ClanMovement[]
}

const locationSchema = new Schema(
  {
    countryCode: { required: false, type: String },
    id: { required: true, type: Number },
    isCountry: { required: true, type: Boolean },
    name: { required: true, type: String },
  },
  { _id: false },
)

const clanMovementSchema = new Schema(
  {
    badgeId: { required: true, type: Number },
    clanScore: { required: true, type: Number },
    location: { required: true, type: locationSchema },
    members: { required: true, type: Number },
    name: { required: true, type: String },
    previousRank: { required: true, type: Number },
    rank: { required: true, type: Number },
    tag: { required: true, type: String },
  },
  { _id: false },
)

const StatisticsSchema = new Schema<Statistics>(
  {
    fallers: { required: true, type: [clanMovementSchema] },
    lbLastUpdated: { required: true, type: Number }, // TODO: change this to a Date type (?)
    risers: { required: true, type: [clanMovementSchema] },
  },
  { collection: 'Statistics', versionKey: false },
)

export const StatisticsModel: Model<Statistics> =
  mongoose.models.Statistics || mongoose.model<Statistics>('Statistics', StatisticsSchema)
