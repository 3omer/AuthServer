const jwt = require('jsonwebtoken')
const router = require('express').Router()
const mongoose = require('mongoose')
const User = require('../models/User')

const {
  auth,
  userValidator,
  loginDataValidaor,
  validationResult,
} = require('../middleware')

const {
  generateVerifLink,
  sendVerifEmail,
  isNodemailerError,
  logger,
} = require('../utils')

// handle post: register
router.post('/api/users', userValidator(), async (req, res, next) => {
  // check for validation errors
  const vErrors = validationResult(req)
  if (!vErrors.isEmpty())
    return res.status(400).json({ errors: vErrors.array() })

  const data = req.body
  const user = new User(data)
  try {
    await user.save()
    // build verification link to send it to user email
    const verifLink = generateVerifLink(user)
    await sendVerifEmail(verifLink, user.email)
    return res.status(201).json({ user })
  } catch (error) {
    // TODO: type of error: validation? connection?
    logger.error(error)
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: error.message })
    }
    // sending email failed
    if (isNodemailerError(error)) {
      res.status = user.id ? 201 : 503
      return res.json({
        error: 'Verification email is not sent',
        user,
      })
    }
    return next(error)
  }
})

// verify account. the token is passed as query params
router.get('/api/users/verify', async (req, res, next) => {
  const { token } = req.query
  try {
    const payload = jwt.verify(token, process.env.JWT_KEY)
    const user = await User.findById(payload.id)
    if (!user) return res.status(400).json({ error: 'Account not found' })
    user.isVerified = true
    await user.save()
    return res.json({
      msg: 'Your account is now activated',
    })
  } catch (error) {
    logger.error(error.message)

    if (error instanceof jwt.TokenExpiredError) {
      return res
        .status(400)
        .json({ error: 'Token expired. Try registering again' })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res
        .status(400)
        .json({ error: 'Token is invalid or request is malformed' })
    }
    return next(error)
  }
})

// login
router.post('/api/users/login', loginDataValidaor(), async (req, res) => {
  // is login creds there to begin with
  const vErrors = validationResult(req)
  if (!vErrors.isEmpty())
    return res.status(400).json({ error: 'Invalid login credentials' })

  const { email, password } = req.body
  try {
    const user = await User.findByCredentials(email, password)
    if (!user) {
      return res.status(401).json({ error: 'Invalid login credentials' })
    }
    if (!user.isVerified) {
      return res.status(401).json({ error: 'Account is not verified' })
    }
    const token = await user.generateToken()
    return res.json({
      user,
      token,
    })
  } catch (error) {
    logger.error(error)
    return res.status(500).send(error.message)
  }
})

// get user profile
// token required
router.get('/api/users/me', auth, async (req, res) => {
  res.json({ user: req.user })
})

// add token to invokedTokensId
router.post('/api/users/me/logout', auth, async (req, res, next) => {
  const { user } = req
  user.invokedTokensId.push(req.jti)

  try {
    await user.save()
    return res.json({ message: 'Logged out successfully' })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
