import cors from 'cors'
import express, { Application, json, Request, Response, urlencoded } from 'express'
import helmet from 'helmet'

import getCurrentSeasonController from '@/controllers/get-current-season'
import patchRisersAndFallersController from '@/controllers/patch-risers-fallers'
import verifyInternalToken from '@/middleware/auth'
import { errorHandler, notFound } from '@/middleware/errors'
import requestLogger from '@/middleware/logtail'
import clanRouter from '@/routes/clan.routes'
import emojiRouter from '@/routes/emoji.routes'
import guildRouter from '@/routes/guild.routes'
import leaderboardRouter from '@/routes/leaderboard.routes'
import linkedClanRouter from '@/routes/linked-clan.routes'
import playerRouter from '@/routes/player.routes'
import plusRouter from '@/routes/plus.routes'
import userRouter from '@/routes/user.routes'

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
app.use(json({ limit: '550kb' }))
app.use(urlencoded({ extended: true, limit: '550kb' }))

// Logging middleware
app.use(requestLogger)

// Set default response headers
app.use((req: Request, res: Response, next) => {
  res.setHeader('Content-Type', 'application/json')
  next()
})

// Authentication middleware (applies to all routes)
app.use(verifyInternalToken)

// API routes
app.use('/player', playerRouter)
app.use('/clan', clanRouter)
app.use('/leaderboard', leaderboardRouter)
app.use('/plus', plusRouter)
app.use('/guild', guildRouter)
app.use('/user', userRouter)
app.use('/emoji', emojiRouter)
app.use('/linked-clan', linkedClanRouter)

app.get('/current-season', getCurrentSeasonController)
app.patch('/risers-fallers', patchRisersAndFallersController)

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is running', status: 200 })
})

// Error handlers
app.use(notFound)
app.use(errorHandler)

export default app
