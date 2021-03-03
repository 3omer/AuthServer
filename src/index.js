const http = require("http")
const app = require('./app')
const logger = require("./utils").logger

const PORT = process.env.PORT
const server = http.createServer(app)

server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`)
})