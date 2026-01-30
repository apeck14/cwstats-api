/* eslint-disable no-console */
import { config } from 'dotenv'
config()

import { connectDB } from '@/config/db'
import { closeRedis, getRedis } from '@/config/redis'

import app from './app'

const HOST = process.env.NODE_ENV === 'production' ? '127.0.0.1' : 'localhost'
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
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server')
  await closeRedis()
  if (server) {
    server.close(() => console.log('HTTP server closed'))
  }
})

const startServer = async () => {
  // Connect to MongoDB
  await connectDB()

  // Connect to Redis
  const redis = getRedis()
  await redis.connect()

  // Start HTTP server
  server = app.listen(PORT, HOST, () =>
    console.log(`Server running in ${process.env.NODE_ENV} mode on http://${HOST}:${PORT}`)
  )
}

startServer().catch((err) => console.error(`Server startup failed: ${err}`))
