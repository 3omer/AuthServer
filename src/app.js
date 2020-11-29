const express = require("express")
const app = express()
require("./db/db")

const PORT = process.env.PORT

app.use(express.json())
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})