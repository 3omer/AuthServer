const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')

const logger = {
  error(...params) {
    if (process.env.NODE_ENV === 'test') return
    console.error(...params)
  },
  info(...params) {
    if (process.env.NODE_ENV === 'test') return
    console.log(...params)
  },
}

const generateVerifLink = (user) => {
  const payload = {
    id: user.id,
  }

  const token = jwt.sign(payload, process.env.JWT_KEY, {
    expiresIn: process.env.VERIF_JWT_EXP,
  })

  return `http://${process.env.HOST || 'localhost'}:${
    process.env.PORT
  }/api/users/verify?token=${token}`
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
})

/**
 * Send user email containing a verifivation link
 * @param {*} verifLink verification link typically a URL with a token to verify user's email
 * @param {*} receiverEmail user registered email address
 */
const sendVerifEmail = async (verifLink, receiverEmail) => {
  if (process.env.NODE_ENV === 'test') return
  transporter
    .sendMail({
      from: '"Omar Mohammed" <omer@example.com>', // sender address
      to: receiverEmail, // list of receivers
      subject: 'X-COMPANY verify  your account', // Subject line
      text: 'Hello', // plain text body
      html: `<p>Hello Click the buttion below to verify your account</p>
        <button><a href=${verifLink}>HERE</a></button>`, // html body
    })
    .catch((error) => {
      // eslint-disable-next-line no-param-reassign
      error.name = 'NodemailerError'
      throw error
    })
}

const PASS_REST_JWT_EXP = process.env.PASS_REST_JWT_EXP || '1h'
const generatePassResetLink = (user) => {
  const payload = {
    id: user.id,
  }

  const token = jwt.sign(payload, process.env.JWT_KEY, {
    expiresIn: PASS_REST_JWT_EXP,
  })

  return `http://${process.env.HOST || 'localhost'}:${
    process.env.PORT
  }/api/users/confirm-reset?token=${token}`
}

const sendPasswordResetEmail = async (resetLink, to) => {
  if (process.env.NODE_ENV === 'test') return
  transporter
    .sendMail({
      to,
      from: 'support@CoolestApp.com',
      subject: 'Password reset request',
      html: `<a href=${resetLink}>reset password</a>`,
    })
    .then(() => {
      logger.info('Reset email sent to ', to)
    })
    .catch((err) => {
      logger.error('Sending reset email to ', to, 'failed:', err)
    })
}

const isNodemailerError = (error) => error.name === 'NodemailerError'

module.exports = {
  sendVerifEmail,
  generateVerifLink,
  isNodemailerError,
  sendPasswordResetEmail,
  generatePassResetLink,
  logger,
}
