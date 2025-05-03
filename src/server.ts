/* eslint-disable no-console */
import { config } from 'dotenv'

import app from './app'
import { connectDB } from './config/db'

config()

const PORT = process.env.PORT || 3000

let server: ReturnType<typeof app.listen>

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err}`)
  if (server) {
    server.close(() => {
      process.exit(1)
    })
  } else {
    process.exit(1)
  }
})

// Handle SIGTERM signal
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  if (server) {
    server.close(() => {
      console.log('HTTP server closed')
    })
  }
})

connectDB()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error(`Server startup failed: ${err}`)
  })
