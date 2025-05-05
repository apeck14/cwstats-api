import cors from 'cors'
import express, { Application, json, Request, Response, urlencoded } from 'express'
import helmet from 'helmet'

import verifyInternalToken from './middleware/auth'
import { errorHandler, notFound } from './middleware/errors'
import clanRouter from './routes/clan.routes'
import guildRouter from './routes/guild.routes'
import leaderboardRouter from './routes/leaderboard.routes'
import playerRouter from './routes/player.routes'
import plusRouter from './routes/plus.routes'

// Initialize express app
const app: Application = express()

// Trust NGINX or other proxies to set real IP and protocol
app.set('trust proxy', true)

// Apply middlewares
app.use(helmet()) // Security headers

// CORS: Allow only website in prod, localhost in dev
app.use(
  cors({
    credentials: true,
    origin: process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://cwstats.com',
  }),
)

// JSON and URL-encoded body parsing
app.use(json())
app.use(urlencoded({ extended: true }))

// Set default response headers
app.use((req: Request, res: Response, next) => {
  res.setHeader('Content-Type', 'application/json')
  next()
})

// Authentication middleware (applies to all routes)
app.use(verifyInternalToken)

// API routes
app.use('/api/player', playerRouter)
app.use('/api/clan', clanRouter)
app.use('/api/leaderboard', leaderboardRouter)
app.use('/api/plus', plusRouter)
app.use('/api/guild', guildRouter)

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is running', status: 200 })
})

// Error handlers
app.use(notFound)
app.use(errorHandler)

export default app
