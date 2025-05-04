export class DiscordApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'DiscordApiError'
    this.status = status
  }
}
