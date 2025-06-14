import { Request, Response } from 'express'
import { ZodError } from 'zod'

import { calcLinkedPlayerLimit, generateDiscordNickname } from '@/lib/utils'
import { putGuildNudgeLinkSchema } from '@/schemas/mongo'
import { updateDiscordUserNickname } from '@/services/discord'
import { addNudgeLink, getGuild, getLinkedClansByGuild, getPlusClans } from '@/services/mongo'
import { getPlayer } from '@/services/supercell'

/**
 * Add a nudge link for a specified guild
 * @route PUT /guild/:id/nudge-link
 */
export const putGuildNudgeLinkController = async (req: Request, res: Response) => {
  try {
    const parsed = putGuildNudgeLinkSchema.parse({
      body: req.body,
      params: req.params,
    })

    const { id } = parsed.params
    const { tag, userId } = parsed.body

    const [{ data: player, error, status }, guild] = await Promise.all([getPlayer(tag), getGuild(id)])

    if (!guild) {
      res.status(404).json({ error: 'Guild not found.', status: 404 })
      return
    }

    if (error || !player) {
      res.status(status || 404).json({ error: error || 'Player not found.', status: status || 404 })
      return
    }

    const { nudges } = guild
    const { links, updateNicknameUponLinking } = nudges || {}

    // check if limit exceeded
    if (links) {
      const [linkedClans, plusTags] = await Promise.all([
        getLinkedClansByGuild(id),
        getPlusClans(true, {}, {}),
      ])

      if (!linkedClans || !plusTags) throw new Error()

      const linkedPlusClans = linkedClans.filter((c) => plusTags.includes(c.tag))
      const linkedPlayerLimit = calcLinkedPlayerLimit(linkedPlusClans.length)

      if (links.length >= linkedPlayerLimit) {
        res.status(403).json({ error: 'Link limit reached.', status: 403 })
        return
      }
    }

    const { modifiedCount } = await addNudgeLink({
      guildId: id,
      name: player.name,
      tag: player.tag,
      userId,
    })

    if (!modifiedCount) {
      res.status(409).json({ error: 'Tag already linked to another user.', status: 409 })
      return
    }

    // update user nickname in guild
    if (updateNicknameUponLinking) {
      const existingLinks = links?.filter((l) => l.discordID === userId).map((l) => l.name) || []
      const newNickname = generateDiscordNickname([...existingLinks, player.name])

      // non-blocking
      updateDiscordUserNickname({ guildId: id, nickname: newNickname, userId })
    }

    res.status(200).json({ guildId: id, name: player.name, success: true, tag, userId })
  } catch (err) {
    if (err instanceof ZodError) {
      const e = err.errors[0]
      const formattedErr = `Field "${e.path.join('.')}" - ${e.message}`

      res.status(400).json({
        error: formattedErr,
        status: 400,
      })
      return
    }

    res.status(500).json({ error: 'Internal server error', status: 500 })
  }
}

export default putGuildNudgeLinkController
