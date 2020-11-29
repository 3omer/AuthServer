const express = require("express")
const app = express()
require("./db/db")
const userRouter = require("./routers/user")

const PORT = process.env.PORT

app.use(express.json())
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

// register routers
app.use(userRouter)
module.exports = app