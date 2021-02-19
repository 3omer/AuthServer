require("dotenv").config()
const express = require("express")
const app = express()
const morgan = require("morgan")
require("./db/db")
const userRouter = require("./routers/user")

app.use(express.json())
app.use(morgan("dev"))
// register routers
app.use(userRouter)

module.exports = app