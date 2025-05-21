import mongoose, { Document, Model, Schema } from 'mongoose'

export interface DailyLeaderboard extends Document {
  badgeId: number
  clanScore: number
  location: object
  name: string
  tag: string
  boatPoints: number
  crossedFinishLine: boolean
  decksRemaining: number
  fameAvg: number
  isTraining: boolean
  notRanked: boolean
  projPlacement: number | null
  rank: number
}

const dailyLeaderboardSchema = new Schema<DailyLeaderboard>(
  {
    badgeId: { required: true, type: Number },
    boatPoints: { required: true, type: Number },
    clanScore: { required: true, type: Number },
    crossedFinishLine: { required: true, type: Boolean },
    decksRemaining: { required: true, type: Number },
    fameAvg: { required: true, type: Number },
    isTraining: { required: true, type: Boolean },
    location: { required: true, type: Object },
    name: { required: true, type: String },
    notRanked: { required: true, type: Boolean },
    projPlacement: { default: null, required: false, type: Number },
    rank: { required: true, type: Number },
    tag: { required: true, type: String },
  },
  { collection: 'Daily Clan Leaderboard' },
)

export const DailyLeaderboardModel: Model<DailyLeaderboard> =
  mongoose.models.DailyLeaderboard ||
  mongoose.model<DailyLeaderboard>('DailyLeaderboard', dailyLeaderboardSchema)
