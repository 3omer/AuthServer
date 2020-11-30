const User = require("../models/User")
const router = require("express").Router()
const auth = require('../middleware/auth');

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

// handle post: register
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
        // TODO: type of error: validation? connection?
        res.status(400).send(error)
    }
})

// login
router.post("/api/users/login", async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await User.findByCredentials(email, password)
        if (!user) {
            return res.status(401).json({ error: "Invalid login credentials" })
        }
        const token = await user.generateToken()
        return res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            token: token
        })

    } catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
})


// get user profile
// token required
router.get("/api/users/me", auth, async (req, res) => {
    res.json(req.user)
})

module.exports = router