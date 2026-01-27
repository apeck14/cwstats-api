import mongoose, { Document, Model, Schema } from 'mongoose'

export interface WebhookEvent extends Document {
  eventId: string
  eventType: string
  metadata?: Record<string, unknown>
  processedAt: Date
}

const webhookEventSchema = new Schema<WebhookEvent>(
  {
    eventId: { index: true, required: true, type: String, unique: true },
    eventType: { required: true, type: String },
    metadata: { type: Schema.Types.Mixed },
    processedAt: { default: Date.now, required: true, type: Date }
  },
  { collection: 'processed_webhook_events', versionKey: false }
)

// Auto-expire events after 30 days to prevent unbounded growth
webhookEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

export const WebhookEventModel: Model<WebhookEvent> =
  mongoose.models.WebhookEvent || mongoose.model<WebhookEvent>('WebhookEvent', webhookEventSchema)
