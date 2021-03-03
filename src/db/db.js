const mongoose = require("mongoose")
const logger = require("../utils").logger

const MONGODB_URL = process.env.MONGODB_URL

logger.info('Mongodb is connecting .. .', { MONGODB_URL })

mongoose.connect(MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then(() => {
    logger.info('Mongodb connected', { MONGODB_URL })
}).catch((err) => {
    logger.error("Mongodb connection failed -", { MONGODB_URL })
})