const Redis = require('ioredis')
const { logger } = require('./utils')

const { REDIS_URI } = process.env

logger.info(`Redis connection to ${REDIS_URI}`)

const client = new Redis(REDIS_URI) // uses defaults unless given configuration object
client.on('connect', () => {
  logger.info('Redis is connected')
})

client.on('error', (error) => logger.error(error))

const KEY_PREFIX_REVOKED_TOKENS = 'REVOKED_TOKENS:'

const revokedTokenStore = {
  async find(jti) {
    const key = KEY_PREFIX_REVOKED_TOKENS + jti
    const isRevoked = await client.get(key)
    return isRevoked
  },
  async insert(jti, token) {
    const key = KEY_PREFIX_REVOKED_TOKENS + jti
    const TTL = 12 * 60 * 60 // 12hr is the token's exp time
    await client.set(key, token, 'EX', TTL)
  },
}
module.exports = { client, revokedTokenStore }
