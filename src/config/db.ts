/* eslint-disable no-console */
import mongoose from 'mongoose'

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
export const connectDB = async (): Promise<void> => {
  try {
    // Prevent duplicate connections in development environments (e.g., nodemon restarts)
    if (mongoose.connection.readyState === 1) {
      return
    }

    const uri =
      process.env.NODE_ENV === 'development' ? process.env.MONGODB_TEST_URI : process.env.MONGODB_URI

    if (!uri) {
      throw new Error('MongoDB URI is not defined in environment variables')
    }

    // Connect to MongoDB
    await mongoose.connect(uri)
    console.log(`MongoDB Connected: ${mongoose.connection.host}`)

    // Handle MongoDB connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`)
    })
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`)
    process.exit(1)
  }
}

/**
 * Disconnect from MongoDB database
 * @returns {Promise<void>}
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect()
    console.log('MongoDB Disconnected')
  } catch (error) {
    console.error(
      `Error disconnecting from MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
