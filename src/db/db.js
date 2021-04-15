const mongoose = require('mongoose')
const { logger } = require('../utils')

const { MONGODB_URL } = process.env

logger.info('Mongodb is connecting .. .', { MONGODB_URL })

mongoose
  .connect(MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info('Mongodb connected', { MONGODB_URL })
  })
  .catch((err) => {
    logger.error(
      'Mongodb connection failed to URL',
      { MONGODB_URL },
      'error:',
      err.message
    )
  })
