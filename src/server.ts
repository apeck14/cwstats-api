/* eslint-disable no-console */
import { config } from 'dotenv'

import { connectDB } from '@/config/db'

import app from './app'

config()

const HOST = process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0'
const PORT = Number(process.env.PORT) || 5000

let server: ReturnType<typeof app.listen>

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection:`, err)
  if (server) {
    server.close(() => process.exit(1))
  } else {
    process.exit(1)
  }
})

// Handle SIGTERM signal
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  if (server) {
    server.close(() => console.log('HTTP server closed'))
  }
})

connectDB()
  .then(() => {
    server = app.listen(PORT, HOST, () =>
      console.log(`Server running in ${process.env.NODE_ENV} mode on http://${HOST}:${PORT}`),
    )
  })
  .catch((err) => console.error(`Server startup failed: ${err}`))
