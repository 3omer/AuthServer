const express = require("express")
require("dotenv").config()
const app = express()
require("./db/db")
const userRouter = require("./routers/user")

app.use(express.json())

// register routers
app.use(userRouter)

module.exports = app