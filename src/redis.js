const Redis = require('ioredis')
const { logger } = require('./utils')

const { REDIS_URI } = process.env

logger.info(`Redis connection to ${REDIS_URI}`)

const client = new Redis(REDIS_URI) // uses defaults unless given configuration object
client.on('connect', () => {
  logger.info('Redis is connected')
})

client.on('error', (error) => logger.error(error))
module.exports = { client }
