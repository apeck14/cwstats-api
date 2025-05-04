import mongoose, { Document, Model, Schema } from 'mongoose'

export interface DailyTrackingEntry {
  attacks: number
  fame: number
  missed: boolean
  name: string
  tag: string
}

export interface DailyTracking {
  day: number
  scores: DailyTrackingEntry[]
  season: number
  timestamp: Date
  week: number
}

export interface HourlyAverage {
  attacksCompleted: number
  avg: number
  day: number
  lastHourAvg: number
  season: number
  timestamp: Date
  week: number
}

export interface PlusClan extends Document {
  tag: string
  dailyTracking: DailyTracking[]
  hourlyAverages: HourlyAverage[]
}

const dailyTrackingEntrySchema = new Schema({
  attacks: { required: true, type: Number },
  fame: { required: true, type: Number },
  missed: { required: true, type: Boolean },
  name: { required: true, type: String },
  tag: { required: true, trim: true, type: String },
})

const dailyTrackingSchema = new Schema({
  day: { max: 4, min: 1, required: true, type: Number },
  scores: { required: true, type: [dailyTrackingEntrySchema] },
  season: { required: true, type: Number },
  timestamp: { required: true, type: Date },
  week: { max: 5, min: 1, required: true, type: Number },
})

const hourlyAverageSchema = new Schema({
  attacksCompleted: { required: true, type: Number },
  avg: { required: true, type: Number },
  day: { max: 4, min: 1, required: true, type: Number },
  lastHourAvg: { required: true, type: Number },
  season: { required: true, type: Number },
  timestamp: { required: true, type: Date },
  week: { max: 5, min: 1, required: true, type: Number },
})

const plusClanSchema = new Schema<PlusClan>(
  {
    dailyTracking: { default: [], required: true, type: [dailyTrackingSchema] },
    hourlyAverages: { default: [], required: true, type: [hourlyAverageSchema] },
    tag: { required: true, trim: true, type: String, unique: true },
  },
  { collection: 'CWStats+' },
)

export const PlusClanModel: Model<PlusClan> =
  mongoose.models.PlusClan || mongoose.model<PlusClan>('PlusClan', plusClanSchema)
