# Redis Setup Plan for CWStats

## Overview

This document outlines the plan to set up Redis on your VPS and integrate it across the CWStats repos (API, Web, Bot). The primary goal is to store and search Clash Royale players (name, tag, clan name) for fast autocomplete in:

1. **Website** - Homepage search bar and `/spy` page player search
2. **Discord Bot** - `/spy -search` autocomplete

### Scale Requirements

- **Expected entries:** 5-10 million players
- **Data per player:** ~240 bytes (name, nameNorm, nameLower, tag, clanName + index)
- **Estimated memory:** ~2.4 GB for 10M players
- **Search latency:** Sub-20ms autocomplete response times

> ⚠️ **Important:** At this scale, we **must use RediSearch** for efficient full-text search. Simple sorted sets with ZSCAN would be far too slow for prefix matching across millions of entries. Redis 8.x includes RediSearch and other modules by default.

---

## Table of Contents

1. [VPS Redis Setup](#1-vps-redis-setup)
2. [Architecture Overview](#2-architecture-overview)
3. [API Changes (cwstats-api)](#3-api-changes-cwstats-api)
4. [Website Changes (cwstats-web)](#4-website-changes-cwstats-web)
5. [Discord Bot Changes (cwstats-bot)](#5-discord-bot-changes-cwstats-bot)
6. [Migration Strategy](#6-migration-strategy)
7. [Monitoring & Maintenance](#7-monitoring--maintenance)

---

## 1. VPS Redis Setup

### 1.1 Install Redis 8.x (with built-in modules)

Redis 8.x includes RediSearch, RedisJSON, RedisTimeSeries, and RedisBloom modules by default.

```bash
# Add Redis repository
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

# Update and install Redis
sudo apt update
sudo apt install redis -y

# Verify version and modules
redis-cli INFO server | grep redis_version
# Should show: redis_version:8.4.0

redis-cli MODULE LIST
# Should show: search, ReJSON, timeseries, bf (bloom filter)
```

### 1.2 Configure Redis (Optional)

Redis 8.x defaults are secure for localhost-only setups. The only recommended change is setting a memory cap:

```bash
# Set max memory to 6GB (enough for ~10M players + buffer)
redis-cli CONFIG SET maxmemory 6gb

# Persist the change to redis.conf
redis-cli CONFIG REWRITE
```

**Verify settings:**

```bash
redis-cli CONFIG GET bind
# Should show: 127.0.0.1 (localhost only - secure by default)

redis-cli CONFIG GET maxmemory
# Should show: 6442450944 (6GB)

redis-cli CONFIG GET maxmemory-policy
# Default: noeviction (won't evict data - keeps player data safe)
```

### 1.3 Enable and Start Redis

```bash
# Restart Redis to apply changes
sudo systemctl restart redis-server

# Enable Redis to start on boot
sudo systemctl enable redis-server

# Verify Redis is running with modules
sudo systemctl status redis-server
redis-cli MODULE LIST | grep search

# Test connection
redis-cli ping
```

### 1.4 Create the Search Index

Run this once to create the RediSearch index for players:

```bash
redis-cli
```

```redis
FT.CREATE players:idx
  ON HASH
  PREFIX 1 "player:"
  SCHEMA
    name TEXT NOSTEM SORTABLE
    nameNorm TEXT NOSTEM
    nameLower TAG
    tag TAG
    clanName TEXT NOSTEM
```

This creates an index that:

- Watches all hashes with prefix `player:`
- `name` as TEXT for display and sorting
- `nameNorm` as TEXT for search (normalized: lowercase, ASCII punctuation stripped, spaces preserved for word tokenization)
- `nameLower` as TAG for exact lowercase matching (backup for edge cases)
- `tag` as TAG for exact lookups
- `clanName` as TEXT for display in results

**Why normalize with spaces?** This allows flexible word-level matching:

- `(ReKt) Mider8` → stored as `rekt mider8` (two searchable words)
- Searching `rekt`, `mider`, `(rekt)` all match
- Each word is independently searchable via TEXT field tokenization
- Unicode characters (emojis, symbols) are preserved

### 1.5 Configure Firewall (if applicable)

Redis should NOT be exposed to the internet. Since all repos run on the same VPS, Redis only needs to bind to localhost:

```bash
# Ensure Redis port is NOT open externally
sudo ufw deny 6379
```

### 1.5 Environment Variables

Add to each repo's `.env` file on the VPS:

```env
REDIS_URL=redis://127.0.0.1:6379
```

#### Local Development (SSH Tunnel)

To access VPS Redis from your local machine, open an SSH tunnel:

```bash
ssh -L 6379:127.0.0.1:6379 aaron@srv567353 -N
```

Then use the same URL locally:

```env
REDIS_URL=redis://127.0.0.1:6379
```

Keep the tunnel running in a terminal while developing.

---

## 2. Architecture Overview

### 2.1 Data Flow

Since all repos run on the same VPS, they connect **directly to Redis** on `localhost:6379` - no API routes needed for search.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              VPS (localhost)                             │
│                                                                          │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │
│  │   Website   │     │   Discord   │     │    API      │                │
│  │  (Next.js)  │     │     Bot     │     │  (Express)  │                │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                │
│         │                   │                   │                        │
│         │ Direct Redis      │ Direct Redis      │ Direct Redis           │
│         │ FT.SEARCH         │ FT.SEARCH         │ HSET (upsert)          │
│         │ (read)            │ (read)            │ (write)                │
│         │                   │                   │                        │
│         └───────────────────┼───────────────────┘                        │
│                             │                                            │
│                             ▼                                            │
│                    ┌─────────────────────────────┐                       │
│                    │       Redis 8.x             │                       │
│                    │   localhost:6379            │                       │
│                    │  ┌─────────────────────┐   │                       │
│                    │  │  FT.SEARCH Index    │   │  ← 5-10M players     │
│                    │  │  players:idx        │   │    sub-10ms search   │
│                    │  └─────────────────────┘   │                       │
│                    │  ┌─────────────────────┐   │                       │
│                    │  │   Hash (Data)       │   │                       │
│                    │  │  player:{tag}       │   │                       │
│                    │  └─────────────────────┘   │                       │
│                    └─────────────────────────────┘                       │
│                                 ▲                                        │
│                                 │                                        │
│                    ┌────────────┴────────────┐                          │
│                    │  On /player/:tag call   │                          │
│                    │  API upserts to Redis   │                          │
│                    └─────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Access Pattern Summary

| Repo             | Operation      | Method                                     |
| ---------------- | -------------- | ------------------------------------------ |
| **cwstats-api**  | Write players  | Direct Redis `HSET` on player fetch        |
| **cwstats-web**  | Search players | Direct Redis `FT.SEARCH` in server action  |
| **cwstats-bot**  | Search players | Direct Redis `FT.SEARCH` for autocomplete  |
| **cwstats-jobs** | Bulk populate  | Direct Redis pipeline (one-time migration) |

### 2.2 Redis Data Structure (RediSearch)

With 5-10 million players, we use **RediSearch** (included in Redis 8.x) for efficient full-text autocomplete.

#### Data Storage

Each player is stored as a Redis Hash:

```redis
HSET player:#ABC123
  name "(ReKt) Mider8"
  nameNorm "rekt mider8"
  nameLower "(rekt) mider8"
  tag "#ABC123"
  clanName "ClanName"
```

#### Search Index

RediSearch automatically indexes these hashes and enables:

- **Prefix search:** `FT.SEARCH players:idx "@nameNorm:mider*"` - sub-10ms for millions of entries
- **Word tokenization** - TEXT field splits on spaces, so "mider" matches "rekt mider8"
- **Case-insensitive** - via lowercase normalization
- **Flexible matching** - `rekt`, `mider`, `(rekt)` all match the same player

#### Memory Estimation

| Component            | Size per Player | Total (10M players) |
| -------------------- | --------------- | ------------------- |
| Hash data (5 fields) | ~120 bytes      | ~1.2 GB             |
| Search index         | ~90 bytes       | ~0.9 GB             |
| Overhead             | ~30 bytes       | ~0.3 GB             |
| **Total**            | ~240 bytes      | **~2.4 GB**         |

### 2.3 Redis Key Schema

```
# Player data hash (indexed by RediSearch)
player:{tag}                 → Hash { name, nameNorm, nameLower, tag, clanName }
```

---

## 3. API Changes (cwstats-api)

### 3.1 Install Dependencies

```bash
cd cwstats-api
npm install ioredis
npm install -D @types/ioredis
```

### 3.2 Create Redis Configuration

**New file:** `src/config/redis.ts`

```typescript
import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379'

let redis: Redis | null = null

export const getRedis = (): Redis => {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true
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
```

### 3.3 Create Redis Player Service

**New file:** `src/services/redis.ts`

```typescript
import { getRedis } from '@/config/redis'
import { formatTag } from '@/lib/format'

interface PlayerData {
  clanName: string
  name: string
  tag: string
}

interface SearchResult {
  clanName: string
  name: string
  tag: string
}

const PLAYER_HASH_PREFIX = 'player:'
const SEARCH_INDEX = 'players:idx'

/**
 * Escape special characters for RediSearch queries
 */
const escapeRedisearch = (str: string): string => {
  // Escape special characters: ,.<>{}[]"':;!@#$%^&*()-+=~
  return str.replace(/[,.<>{}[\]"':;!@#$%^&*()\-+=~\\]/g, '\\$&')
}

/**
 * Add or update a player in Redis
 * Called whenever a player is fetched from Supercell API
 * Only updates if name or clanName has changed (tag never changes)
 * RediSearch automatically indexes the hash
 */
export const upsertPlayerInRedis = async (player: PlayerData): Promise<void> => {
  const redis = getRedis()
  const tag = formatTag(player.tag, true) // Ensure #TAG format
  const key = `${PLAYER_HASH_PREFIX}${tag}`

  try {
    // Check if player already exists
    const existing = await redis.hmget(key, 'name', 'clanName')
    const [existingName, existingClanName] = existing

    // If player exists and nothing changed, skip update entirely
    if (existingName !== null) {
      const nameChanged = existingName !== player.name
      const clanChanged = (existingClanName || '') !== (player.clanName || '')

      if (!nameChanged && !clanChanged) {
        // No changes, skip write
        return
      }
    }

    // Player is new or has changes - perform upsert (3 fields only)
    await redis.hset(key, {
      clanName: player.clanName || '',
      name: player.name,
      tag
    })
  } catch (err) {
    console.error('Redis upsertPlayer error:', err)
    // Non-blocking - don't throw, just log
  }
}

/**
 * Search players by name prefix using RediSearch
 * Optimized for 5-10M entries with sub-10ms response times
 * Uses TEXT field which is case-insensitive by default
 */
export const searchPlayersInRedis = async (query: string, limit = 10): Promise<SearchResult[]> => {
  const redis = getRedis()
  const normalizedQuery = query.trim()

  if (normalizedQuery.length < 2) {
    return []
  }

  try {
    const escapedQuery = escapeRedisearch(normalizedQuery)

    // Use RediSearch FT.SEARCH with TEXT field prefix matching
    // TEXT fields are case-insensitive by default
    // RETURN limits fields fetched for better performance
    const rawResults = (await redis.call(
      'FT.SEARCH',
      SEARCH_INDEX,
      `@name:${escapedQuery}*`,
      'LIMIT',
      '0',
      String(limit),
      'RETURN',
      '3',
      'name',
      'tag',
      'clanName'
    )) as [number, ...unknown[]]

    return parseSearchResults(rawResults, limit)
  } catch (err) {
    console.error('Redis searchPlayers error:', err)
    return []
  }
}

/**
 * Parse RediSearch FT.SEARCH results into SearchResult array
 */
function parseSearchResults(rawResults: [number, ...unknown[]], limit: number): SearchResult[] {
  const results: SearchResult[] = []

  // Results format: [total, key1, [fields1], key2, [fields2], ...]
  for (let i = 1; i < rawResults.length && results.length < limit; i += 2) {
    const fields = rawResults[i + 1] as string[]
    if (!fields) continue

    const player: Record<string, string> = {}
    for (let j = 0; j < fields.length; j += 2) {
      player[fields[j]] = fields[j + 1]
    }

    if (player.name && player.tag) {
      results.push({
        clanName: player.clanName || '',
        name: player.name,
        tag: player.tag
      })
    }
  }

  return results
}

/**
 * Get a single player from Redis by tag
 */
export const getPlayerFromRedis = async (tag: string): Promise<PlayerData | null> => {
  const redis = getRedis()
  const formattedTag = formatTag(tag, true)

  try {
    const data = await redis.hgetall(`${PLAYER_HASH_PREFIX}${formattedTag}`)
    if (data && data.name) {
      return {
        clanName: data.clanName || '',
        name: data.name,
        tag: data.tag
      }
    }
    return null
  } catch (err) {
    console.error('Redis getPlayer error:', err)
    return null
  }
}

/**
 * Check Redis connection and RediSearch index health
 */
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const redis = getRedis()
    const pong = await redis.ping()
    return pong === 'PONG'
  } catch {
    return false
  }
}
```

### 3.4 Update Player Controller

**Modify:** `src/controllers/player/get-player.ts`

```typescript
import { Request, Response } from 'express'

import { upsertPlayerInRedis } from '@/services/redis'
import { getPlayer } from '@/services/supercell'

/**
 * Get player
 * @route GET /player/:tag
 */
export const playerController = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params

    const { data: player, error, status } = await getPlayer(tag)

    if (error) {
      res.status(status).json({ error, status })
      return
    }

    // Update Redis with player info (non-blocking)
    if (player) {
      upsertPlayerInRedis({
        clanName: player.clan?.name || '',
        name: player.name,
        tag: player.tag
      }).catch(() => {}) // Ignore errors, don't block response
    }

    res.status(200).json({ data: player })
  } catch {
    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default playerController
```

### 3.5 Initialize Redis on Server Start

**Modify:** `src/server.ts`

```typescript
import { getRedis, closeRedis } from '@/config/redis'

// In the startup function, after MongoDB connection:
const redis = getRedis()
await redis.connect()
console.log('Redis connected')

// Add graceful shutdown:
process.on('SIGTERM', async () => {
  await closeRedis()
  process.exit(0)
})
```

### 3.6 Add Environment Variable

**Modify:** `.env.example`

```env
# Redis (localhost on VPS, no auth)
REDIS_URL=redis://127.0.0.1:6379
```

---

## 4. Website Changes (cwstats-web)

Since the website runs on the same VPS, it can connect directly to Redis for player search.

### 4.1 Install Dependencies

```bash
cd cwstats-web
npm install ioredis
```

### 4.2 Create Shared Redis Module

**New file:** `src/lib/redis.js`

```javascript
import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379'

let redis = null

export function getRedis() {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000
    })

    redis.on('error', (err) => {
      console.error('Redis connection error:', err.message)
    })
  }
  return redis
}

/**
 * Escape special characters for RediSearch queries
 */
function escapeRedisearch(str) {
  return str.replace(/[,.<>{}[\]"':;!@#$%^&*()\-+=~\\]/g, '\\$&')
}

/**
 * Search players by name using RediSearch (case-insensitive)
 * @param {string} query - Search query
 * @param {number} limit - Max results
 * @returns {Promise<Array<{name: string, tag: string, clanName: string}>>}
 */
export async function searchPlayers(query, limit = 10) {
  const redis = getRedis()
  const normalizedQuery = query.trim()

  if (normalizedQuery.length < 2) {
    return []
  }

  try {
    const escapedQuery = escapeRedisearch(normalizedQuery)

    // TEXT fields are case-insensitive by default
    // RETURN limits fields for better performance
    const rawResults = await redis.call(
      'FT.SEARCH',
      'players:idx',
      `@name:${escapedQuery}*`,
      'LIMIT',
      '0',
      String(limit),
      'RETURN',
      '3',
      'name',
      'tag',
      'clanName'
    )

    // Parse results: [total, key1, [field, value, ...], key2, ...]
    const results = []
    for (let i = 1; i < rawResults.length && results.length < limit; i += 2) {
      const fields = rawResults[i + 1]
      if (!fields) continue

      const player = {}
      for (let j = 0; j < fields.length; j += 2) {
        player[fields[j]] = fields[j + 1]
      }

      if (player.name && player.tag) {
        results.push({
          clanName: player.clanName || '',
          name: player.name,
          tag: player.tag
        })
      }
    }

    return results
  } catch (err) {
    console.error('Redis search error:', err)
    return []
  }
}
```

### 4.3 Update Server Action

**Modify:** `src/actions/api.js`

The `getPlayersByQuery` server action calls Redis directly (no API route needed):

```javascript
'use server'

import { searchPlayers } from '@/lib/redis'

export async function getPlayersByQuery(query, limit = 5) {
  if (!query || query.length < 2) return { players: [], success: true }

  try {
    const players = await searchPlayers(query, limit)
    return { players, success: true }
  } catch {
    return { players: [], success: false }
  }
}
```

### 4.4 Remove Realm Dependency

After confirming Redis is working, remove the `realm-web` package:

```bash
npm uninstall realm-web
```

### 4.5 Add Environment Variable

**Modify:** `.env.local` and `.env.example`

```env
# Redis (localhost on VPS, no auth)
REDIS_URL=redis://127.0.0.1:6379
```

---

## 5. Discord Bot Changes (cwstats-bot)

Since the bot runs on the same VPS, it can connect directly to Redis for autocomplete.

### 5.1 Install Dependencies

```bash
cd cwstats-bot
npm install ioredis
```

### 5.2 Create Redis Module

**New file:** `src/util/redis.js`

```javascript
import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379'

let redis = null

export function getRedis() {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true
    })
    redis.on('error', (err) => {
      console.error('Redis connection error:', err)
    })
  }
  return redis
}

/**
 * Escape special characters for RediSearch queries
 */
function escapeRedisearch(str) {
  return str.replace(/[,.<>{}[\]"':;!@#$%^&*()\-+=~\\]/g, '\\$&')
}

/**
 * Search players by name using RediSearch
 * @param {string} query - Search query
 * @param {number} limit - Max results (Discord autocomplete max is 25)
 * @returns {Promise<Array<{name: string, tag: string, clanName: string}>>}
 */
export async function searchPlayers(query, limit = 25) {
  const redis = getRedis()
  const normalizedQuery = query.trim()

  if (normalizedQuery.length < 2) {
    return []
  }

  try {
    const escapedQuery = escapeRedisearch(normalizedQuery)

    // FT.SEARCH with TEXT field (case-insensitive by default)
    const rawResults = await redis.call(
      'FT.SEARCH',
      'players:idx',
      `@name:${escapedQuery}*`,
      'LIMIT',
      '0',
      String(Math.min(limit, 25)),
      'RETURN',
      '3',
      'name',
      'tag',
      'clanName'
    )

    // Parse results: [total, key1, [field, value, ...], key2, ...]
    const results = []
    for (let i = 1; i < rawResults.length && results.length < limit; i += 2) {
      const fields = rawResults[i + 1]
      if (!fields) continue

      const player = {}
      for (let j = 0; j < fields.length; j += 2) {
        player[fields[j]] = fields[j + 1]
      }

      if (player.name && player.tag) {
        results.push({
          clanName: player.clanName || '',
          name: player.name,
          tag: player.tag
        })
      }
    }

    return results
  } catch (err) {
    console.error('Redis search error:', err)
    return []
  }
}
```

### 5.3 Update Spy Command Autocomplete

**Modify:** `src/commands/spy.js`

Update the `search` method to use direct Redis:

```javascript
import { searchPlayers } from '../util/redis.js'

// In the search method:
async search(i) {
  const query = i.options.getFocused()

  if (!query || query.length < 2) {
    return [{ name: '🔎 Type at least 2 characters to search', value: 'no_match' }]
  }

  const players = await searchPlayers(query, 25)

  return players.map((p) => ({
    name: `${p.name} ${p.clanName ? `(${p.clanName})` : ''}`.substring(0, 100),
    value: p.tag
  }))
}
```

> **Note:** The `search` method returns an array - the `handleAutocomplete` function in `interactionCreate.js` calls `i.respond()` with the results.

### 5.4 Add Environment Variable

**Modify:** `config.js` or `.env`

```env
# Redis (localhost on VPS, no auth)
REDIS_URL=redis://127.0.0.1:6379
```

---

## 6. Migration Strategy

No existing player data in MongoDB, so Redis will populate organically as players are fetched.

### 6.1 Phase 1: VPS Setup

1. Install and configure Redis 8.x on VPS
2. Create the RediSearch index
3. Verify Redis is running

### 6.2 Phase 2: API Integration

1. Add Redis service to API, deploy
2. Verify Redis connection and player upserts work
3. Test search queries manually via `redis-cli`

### 6.3 Phase 3: Web Integration

1. Add Redis module to web
2. Update search-players route
3. Test homepage search bar
4. Test spy page search
5. Remove Realm dependency

### 6.4 Phase 4: Bot Integration

1. Add Redis module to bot
2. Update spy command autocomplete
3. Test `/spy -search` autocomplete

---

## 7. Monitoring & Maintenance

### 7.1 Redis Monitoring Commands

```bash
# Check memory usage
redis-cli INFO memory

# Check number of keys (should be ~5-10M for players)
redis-cli DBSIZE

# Check RediSearch index stats
redis-cli FT.INFO players:idx

# Monitor real-time commands (careful - high volume)
redis-cli MONITOR

# Test a search query
redis-cli FT.SEARCH players:idx "@name:test*" LIMIT 0 5
```

### 7.2 Memory Management

With `maxmemory-policy volatile-lru` and 5-10M players:

- Player hashes have no TTL - they persist indefinitely
- If memory pressure occurs, increase `maxmemory` in `/etc/redis/redis.conf`

### 7.3 Backup Strategy

Redis snapshots are saved to `/var/lib/redis/dump.rdb`. To backup:

```bash
# Create manual backup
redis-cli BGSAVE

# Copy backup file (large file - 1-2GB)
sudo cp /var/lib/redis/dump.rdb /path/to/backup/redis-backup-$(date +%Y%m%d).rdb

# Compress for storage
gzip /path/to/backup/redis-backup-$(date +%Y%m%d).rdb
```

### 7.4 Health Check Endpoint

Add to API for monitoring:

```typescript
// GET /health/redis
app.get('/health/redis', async (req, res) => {
  const healthy = await checkRedisHealth()
  res.status(healthy ? 200 : 503).json({
    redis: healthy ? 'healthy' : 'unhealthy'
  })
})
```

### 7.5 Index Maintenance

If you need to rebuild the search index:

```bash
# Drop existing index (data preserved)
redis-cli FT.DROPINDEX players:idx

# Recreate index (will re-index all player: hashes)
redis-cli FT.CREATE players:idx ON HASH PREFIX 1 "player:" SCHEMA name TEXT NOSTEM SORTABLE nameNorm TAG tag TAG clanName TEXT NOSTEM
```

**Note:** After recreating the index, existing players without `nameNorm` field won't be searchable until they're re-fetched via `getPlayer()`.

---

## Summary Checklist

### VPS Setup

- [x] Install Redis 8.x (`redis-server` with built-in modules)
- [x] Configure `maxmemory 6gb` (Redis 8.x defaults are secure)
- [x] Enable and start Redis service
- [x] Create RediSearch index (`FT.CREATE players:idx ...`)
- [x] Add `REDIS_URL=redis://127.0.0.1:6379` to all repo `.env` files

### cwstats-api (Write to Redis)

- [x] Install `ioredis` package
- [x] Create `src/config/redis.ts` (connection singleton)
- [x] Create `src/services/redis.ts` (upsert, search, get, health functions)
- [x] Update `get-player.ts` to upsert players on fetch
- [x] Update `put-player-link.ts` to upsert players on link
- [x] Update server startup to connect Redis and graceful shutdown

### cwstats-web (Read from Redis)

- [x] Install `ioredis` package
- [x] Create `src/lib/redis.js` (connection + search function)
- [x] Update `getPlayersByQuery` server action to use direct Redis (no API route needed)
- [x] Remove `realm-web` dependency

### cwstats-bot (Read from Redis)

- [x] Install `ioredis` package
- [x] Create `src/util/redis.js` (connection + search function)
- [x] Update `spy.js` search method to use direct Redis
- [x] Add `REDIS_URL` to config

---

## Expected Performance Improvement

| Metric                        | Before (MongoDB Atlas Search) | After (RediSearch) |
| ----------------------------- | ----------------------------- | ------------------ |
| Autocomplete latency          | 200-500ms                     | **5-15ms**         |
| Search across 10M entries     | 500ms+                        | **<20ms**          |
| Discord autocomplete timeout  | Occasional                    | None               |
| Web search responsiveness     | Noticeable delay              | Instant            |
| API calls to external service | Every search                  | Zero (local Redis) |
| Memory usage                  | N/A (Atlas hosted)            | ~4 GB on VPS       |
