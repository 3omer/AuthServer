const jwt = require("jsonwebtoken")
const User = require("../models/User")


// pull the token from header, verify, fetch user object, append it to req 
const auth = async (req, res, next) => {
    const authHeader = req.header("Authorization")
    try {
        if (!authHeader) throw new jwt.JsonWebTokenError()
        const token = authHeader.replace("Bearer ", "")
        const payload = jwt.verify(token, process.env.JWT_KEY)
        const user = await User.findOne({ _id: payload.id }, { password: false })
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }
        req.user = user
        req.token = token
        next()
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ "error": "Token expired" })
        }
        else if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ "error": "Invalid token" })
        } else {
            return res.status(500).json({ "error": "Internal Server Error" })
        }
    }

}

module.exports = auth