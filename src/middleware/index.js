const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')

// pull the token from header, verify, fetch user object, append it to req
const auth = async (req, res, next) => {
  const authHeader = req.header('Authorization')
  try {
    if (!authHeader)
      throw new jwt.JsonWebTokenError('Authorization header is invalid')

    const token = authHeader.replace('Bearer ', '')
    const payload = jwt.verify(token, process.env.JWT_KEY)

    const user = await User.findOne({ _id: payload.id }, { password: false })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (!user.isVerified) {
      return res.status(400).json({ error: 'Account is not verified' })
    }
    if (user.invokedTokensId.find((jti) => jti === payload.jti)) {
      return res.status(400).json({ error: 'Token has been invoked' })
    }

    req.jti = payload.jti
    req.token = token
    req.user = user
    return next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

const emailValidator = body('email')
  .isEmail()
  .withMessage('you must enter a valid email')

const passwordValidor = body('password')
  .isLength({ min: 8 })
  .withMessage('must be at least 8 characters')

const userValidator = () => [
  body('username')
    .isString()
    .isAlphanumeric()
    .withMessage('only letters and digits are allowed')
    .isLength({ min: 3 })
    .withMessage('must be at least 3 characters'),

  emailValidator,
  passwordValidor,
]

const loginDataValidaor = () => [emailValidator, passwordValidor]

module.exports = {
  auth,
  userValidator,
  loginDataValidaor,
  validationResult,
}
