require('dotenv').config()
const express = require('express')

const app = express()
const morgan = require('morgan')
require('./db/db')
const userRouter = require('./routers/user')
const { logger } = require('./utils')

app.use(express.json())
app.use(morgan('dev'))
// register routers
app.use(userRouter)

// error handler
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  logger.error(error)
  res.status(500).json({ error: 'Something went wrong' })
})

module.exports = app
