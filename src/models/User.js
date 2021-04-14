const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const validator = require("validator")
const mongoose = require("mongoose")
const uuid = require("uuid").v4

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
    },
    password: {
        type: String,
        required: true,
        minLength: 7
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    invokedTokensId: [ String ]
})


// unique pathes validation
userSchema.path('email').validate(async function (value) {
    // in case this user already exist and is updating another field  
    if (!this.isModified('email')) return true
    const count = await User.countDocuments({ email: value })
    return count <= 0
}, 'Email already exists')

userSchema.path('email').validate(validator.isEmail, 'Invalid email string')

userSchema.path('username').validate(async function (value) {
    if (!this.isModified('username')) return true
    const count = await User.countDocuments({ username: value })
    return count <= 0
}, 'Username already exists')

userSchema.path('password').validate(function(value){
    return validator.isLength(value, { min: 7 })
},
    'Password should be at least 7 letters')

userSchema.set('toJSON', {
    transform: function (doc, ret, opt) {
        ret.id = ret._id
        delete ret['password']
        delete ret['invokedTokensId']
        delete ret['__v']
        delete ret['_id']

        return ret
    }
})


userSchema.pre("save", async function () {
    const user = this
    if (user.isModified("password")) {
        if (!validator.isLength(user.password, { min: 7 })) {
            throw new Error({ error: "Short password, minimum characters are 7" })
        }
        user.password = await bcrypt.hash(user.password, 8)
    }
})

userSchema.methods.generateToken = async function () {
    const user = this
    const payload = {
        username: user.username,
        id: user.id
    }

    const token = jwt.sign(payload, process.env.JWT_KEY, {
        expiresIn: process.env.JWT_EXP,
        jwtid: uuid()
    })

    await user.save()
    return token
}

userSchema.statics.findByCredentials = async function (email, password) {

    const user = await User.findOne({ email })
    if (!user) return null
    const isPassowrdMatch = await bcrypt.compare(password, user.password)
    if (!isPassowrdMatch) return null
    return user
}

const User = mongoose.model("User", userSchema)
module.exports = User