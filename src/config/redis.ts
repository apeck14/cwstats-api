/* eslint-disable no-console */
import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL

if (!REDIS_URL) {
  throw new Error('REDIS_URL is not defined in environment variables')
}

let redis: null | Redis = null

export const getRedis = (): Redis => {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      enableReadyCheck: true,
      lazyConnect: true,
      maxRetriesPerRequest: 3
    })

    redis.on('error', (err) => {
      console.error('Redis connection error:', err)
    })

    redis.on('connect', () => {
      console.log('Redis connected')
    })
  }
  return redis
}

export const closeRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit()
    redis = null
  }
}
