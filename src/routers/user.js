const User = require("../models/User")
const router = require("express").Router()
const auth = require('../middleware/auth');
const { generateVerifLink, sendVerifEmail, isNodemailerError, logger } = require("../utils")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")


// handle post: register
router.post("/api/users", async (req, res) => {
    const data = req.body
    const user = new User(data)
    try {
        await user.save()
        // build verification link to send it to user email
        const verifLink = generateVerifLink(user)
        await sendVerifEmail(verifLink, user.email)
        res.status(201).json({ user })

    } catch (error) {
        // TODO: type of error: validation? connection?
        logger.error(error)
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ error: error.message })
        }
        // sending email failed
        else if (isNodemailerError(error)) {
            user.id ? res.status(201) : res.status(503)
            return res.json({
                error: "Verification email is not sent",
                user,
            })
        }
        next(error)
    }
})

// verify account. the token is passed as query params
router.get("/api/users/verify", async (req, res, next) => {
    const token = req.query.token
    try {
        const payload = jwt.verify(token, process.env.JWT_KEY)
        const user = await User.findById(payload.id)
        if (!user) return res.status(400).json({ error: "Account not found" })
        user.isVerified = true
        await user.save()
        return res.json({
            msg: "Your account is now activated"
        })
    } catch (error) {
        logger.error(error.message);

        if (error instanceof jwt.TokenExpiredError) {
            return res.status(400)
                .json({ error: "Token expired. Try registering again" })
        } else if (error instanceof jwt.JsonWebTokenError) {
            return res.status(400)
                .json({ error: "Token is invalid or request is malformed" })
        } else {
            res.status(500)
                .json({ error: "Something went really wrong. Try again later" })
        }
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
        if (!user.isVerified) {
            return res.status(401).json({ error: "Account is not verified" })
        }
        const token = await user.generateToken()
        return res.json({
            user,
            token
        })

    } catch (error) {
        logger.error(error)
        res.status(500).send(error.message)
    }
})


// get user profile
// token required
router.get("/api/users/me", auth, async (req, res) => {
    res.json({ user: req.user })
})

// delete user token
router.post("/api/users/me/logout", auth, async (req, res) => {
    let user = req.user
    user.tokens = user.tokens.filter((ob) => {
        return ob.token != req.token
    })

    try {
        await user.save()
        return res.json({ message: "Logged out successfully" })
    } catch (error) {
        res.status(500).json({ error: "Internal error" })
    }
})

module.exports = router