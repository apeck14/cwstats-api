/* eslint-disable no-console */
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
 * Normalize a name for search indexing
 * - Lowercase for case-insensitivity
 * - Strip ASCII punctuation but KEEP spaces (for word tokenization)
 * - Keep unicode like emojis, special chars
 * "(ReKt) Mider8" → "rekt mider8" (two searchable words)
 */
const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[\x00-\x1F\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]/g, '') // Strip ASCII punctuation but keep space (0x20)
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
}

/**
 * Escape special characters for RediSearch TEXT field queries
 */
const escapeTextQuery = (str: string): string => {
  return str.replace(/[-@!{}()[\]"~*\\:]/g, '\\$&')
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
    // Check if player already exists with all required fields
    const existing = await redis.hmget(key, 'name', 'clanName', 'nameNorm')
    const [existingName, existingClanName, existingNameNorm] = existing

    // If player exists with all fields and nothing changed, skip update
    if (existingName !== null && existingNameNorm !== null) {
      const nameChanged = existingName !== player.name
      const clanChanged = (existingClanName || '') !== (player.clanName || '')

      if (!nameChanged && !clanChanged) {
        // No changes, skip write
        return
      }
    }

    // Player is new or has changes - perform upsert
    // nameNorm: normalized for word-level search (strips ASCII punctuation, keeps spaces)
    // nameLower: full lowercase with original spacing (legacy/backup)
    await redis.hset(key, {
      clanName: player.clanName || '',
      name: player.name,
      nameLower: player.name.toLowerCase(),
      nameNorm: normalizeName(player.name),
      tag
    })
  } catch (err) {
    console.error('Redis upsertPlayer error:', err)
    // Non-blocking - don't throw, just log
  }
}

/**
 * Search players by name prefix using RediSearch
 * Uses TEXT field (nameNorm) with word tokenization for flexible matching
 * "(ReKt) Mider8" → stored as "rekt mider8" → matches "rekt", "mider", etc.
 */
export const searchPlayersInRedis = async (query: string, limit = 10): Promise<SearchResult[]> => {
  const redis = getRedis()
  const normalizedQuery = normalizeName(query.trim())

  if (normalizedQuery.length < 2) {
    return []
  }

  try {
    // TEXT field prefix search - each word in nameNorm is separately searchable
    const escapedQuery = escapeTextQuery(normalizedQuery)
    const rawResults = (await redis.call(
      'FT.SEARCH',
      SEARCH_INDEX,
      `@nameNorm:${escapedQuery}*`,
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
export const getPlayerFromRedis = async (tag: string): Promise<null | PlayerData> => {
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
 * Check Redis connection health
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
