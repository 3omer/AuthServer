const nodemailer = require("nodemailer")
const jwt = require("jsonwebtoken")

const generateVerifToken = (user) => {
    const payload = {
        id: user.id,
    }

    return jwt.sign(payload, process.env.VERIF_JWT_KEY, {
        expiresIn: process.env.JWT_EXP
    })
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
    }
})

/**
 * Send user email containing a verifivation link
 * @param {*} verifLink verification link typically a URL with a token to verify user's email
 * @param {*} receiverEmail user registered email address
 */
const sendVerifEmail = async (verifLink, receiverEmail) => {
    // send mail with defined transport object
    return await transporter.sendMail({
        from: '"Omar Mohammed" <omer@example.com>', // sender address
        to: receiverEmail, // list of receivers
        subject: "X-COMPANY verify  your account", // Subject line
        text: "Hello", // plain text body
        html: `<p>Hello Click the buttion below to verify your account</p>
        <button><a href=${verifLink}>HERE</a></button>`, // html body
    })
}

module.exports = { sendVerifEmail }