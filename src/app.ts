import cors from 'cors'
import express, { Application, json, Request, Response, urlencoded } from 'express'
import helmet from 'helmet'

import { errorHandler, notFound } from './middleware/errors'
import clanRouter from './routes/clan'
import leaderboardRouter from './routes/leaderboard'
import playerRouter from './routes/player'

// Initialize express app
const app: Application = express()

// Apply middlewares
app.use(helmet()) // Security headers
app.use(cors()) // Enable CORS for all routes
app.use(json()) // Parse JSON bodies
app.use(urlencoded({ extended: true })) // Parse URL-encoded bodies

// Set basic headers
app.use((req: Request, res: Response, next) => {
  res.setHeader('Content-Type', 'application/json')
  next()
})

// API routes
app.use('/api/player', playerRouter)
app.use('/api/clan', clanRouter)
app.use('/api/leaderboard', leaderboardRouter)

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is running', status: 'ok' })
})

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

export default app
