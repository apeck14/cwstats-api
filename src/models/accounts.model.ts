import mongoose, { Model, Schema } from 'mongoose'

export interface Account extends Document {
  provider: string
  type: string
  providerAccountId: string
  token_type: string
  access_token: string
  expires_at: number
  refresh_token?: string
  scope?: string
  stripeCustomerId?: string | null
  userId: mongoose.Types.ObjectId
}

const linkedAccountSchema = new Schema<Account>(
  {
    access_token: { required: true, type: String },
    expires_at: { required: true, type: Number },
    provider: { required: true, type: String },
    providerAccountId: { required: true, type: String, unique: true },
    refresh_token: { type: String },
    scope: { type: String },
    stripeCustomerId: { default: null, type: String },
    token_type: { required: true, type: String },
    type: { required: true, type: String },
    userId: { ref: 'User', required: true, type: Schema.Types.ObjectId }
  },
  { collection: 'accounts', versionKey: false }
)

export const AccountModel: Model<Account> =
  mongoose.models.Account || mongoose.model<Account>('Account', linkedAccountSchema)
