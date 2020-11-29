const User = require("../models/User")
const router = require("express").Router()


// get a list of registered users
// require app administrator privildges
// router.get("/api/users", async (req, res) => {
//     try {
//         let users = await User.find()
//         return res.json(users)
//     } catch (error) {
//         res.status(500).send(error)
//     }
// })

// handle post
router.post("/api/users", async (req, res) => {
    const data = req.body
    try {
        const user = new User(data)
        await user.save()
        const token = await user.generateToken()
        res.status(201).json({
            id: user.id,
            username: user.username,
            email: user.email,
            token: token
        })

    } catch (error) {
        res.status(400).send(error)
    }
})

module.exports = router