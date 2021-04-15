const http = require('http')
const app = require('./app')
const { logger } = require('./utils')

const { PORT } = process.env
const server = http.createServer(app)

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})
