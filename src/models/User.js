const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const validator = require("validator")
const mongoose = require("mongoose")

// TODO: custom id
const userSchema = mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: value => {
            if (!validator.isEmail(value)) {
                throw new Error({ "error": "Invalid Email address" })
            }
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 7
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]

})

userSchema.pre("save", async function() {
    const user = this
    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8)
    }
})

userSchema.instance.generateToken = async function () {
    const user = this
    const payload = {
        username: user.username,
        id: user.id
    }

    const token =  jwt.sign(payload, process.env.JWT_KEY, {
        expiresIn: process.env.JWT_EXP
    })
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.static.findByCredentials = async function(email, password) {

    const invalidCredMsg = { error: "Invalid login credentials" }
    const user = await User.findOne({ email })
    if (!user) throw new Error(invalidCredMsg)
    const isPassowrdMatch = await bcrypt.compare(password, user.password)
    if (!isPassowrdMatch) throw new Error(invalidCredMsg)
    return user
}

const User = mongoose.model("User", userSchema)