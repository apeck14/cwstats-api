/* eslint-disable no-console */
import { Logtail } from '@logtail/node'
import { LogtailTransport } from '@logtail/winston'
import { createLogger, format } from 'winston'

if (!process.env.LOGTAIL_TOKEN) {
  console.error('LOGTAIL_TOKEN needs to be set!')
  process.exit(1)
}

const logtail = new Logtail(process.env.LOGTAIL_TOKEN, {
  endpoint: process.env.LOGTAIL_URL
})

const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  level: 'info',
  transports: [new LogtailTransport(logtail)]
})

export default logger
