// test user model
const db = require("./../db/db")

const User = require("./../models/User")

describe("User Model", () => {
    let testUser
    beforeEach(async () => {
        await User.deleteMany({})

        //    valid user for re-use
        testUser = {
            "username": "testuser",
            "password": "testuser",
            "email": "testuser@test.com"
        }

    })
    afterAll(async () => {
        await User.deleteMany({})
        await User.db.close()
    })

    it("hash password and save", async () => {

        await new User(testUser).save()
        const count = await User.find().countDocuments()
        expect(count).toEqual(1)
        const result = await User.findOne()
        expect(result).toHaveProperty("_id")
        expect(result.username).toBe(testUser.username)
        expect(result.password).not.toEqual(testUser.password)
    })

    it("Generate token for user", async () => {
        await new User(testUser).save()
        let user = await User.findOne()
        expect(user.tokens.length).toEqual(0)
        let token = await user.generateToken()
        expect(user.tokens.length).toEqual(1)
        // console.log(user.tokens)
    })

    it("Find user bu their credentilas", async () => {
        await new User(testUser).save()
        let user = await User.findByCredentials(testUser.email, testUser.password)
        expect(user.username).toEqual(testUser.username)
    })



})