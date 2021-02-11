const app = require("../app")
const User = require("../models/User")
const request = require("supertest")


const api = "/api/users"

async function dropUsers() {
    await User.deleteMany()
}

const getUsers = (limit) => {
    // list of user up to limit, default is 5
    limit = !limit ? 5 : limit
    let users = []
    for (let i = 1; i <= limit; i++) {
        let username = "test" + i.toString()
        users.push({
            username: username,
            email: username + "@test.com",
            password: username + "123"
        })
    }
    return users
}

const registerUser = async (user) => {
    return await request(app).post(api).send(user)
}

describe("/api/users", () => {

    beforeEach(dropUsers)

    afterAll(async () => {
        // TODO: tear down the app gracefully
        // await User.db.close()
        // await request.close()
    })


    it("create a new user, retrive user + token", async () => {
        let user = getUsers()[0]
        const res = await registerUser(user)
        expect(res.status).toEqual(201)
        expect(res.body).toHaveProperty("token")
        // password hash is not exposed
        expect(res.body).not.toHaveProperty("password")
    })

    it("reject duplicate email", async () => {
        let [user] = getUsers(1)
        const res = await registerUser(user)
        expect(res.status).toEqual(201)
        const res2 = await registerUser(user)
        expect(res2.status).toEqual(400)

    })

    it("reject invalid email", async () => {
        let [user] = getUsers(1)
        user.email = "notreallyandemail@.com"

        const res = await registerUser(user)
        expect(res.status).toEqual(400)
        // expect(res.body.error).toIncludes("invalid")

    })

    it("reject short password", async () => {
        let [user] = getUsers(1)
        user.password = "short"
        const res = await registerUser(user)
        expect(res.status).toEqual(400)
    })
})


const lgoinUser = async (user) => {
    return await request(app).post("/api/users/login").send({
        email: user.email,
        password: user.password
    })
}

const utils = require("../utils")
describe("/api/users/verify", () => {
    beforeEach(dropUsers)
    it("activate account when called with valid token", async () => {

        const me = getUsers()[0]
        let res = await registerUser(me)
        expect(res.status).toEqual(201)
        let token = utils.generateVerifLink(res.body).split("token=")[1].trim()
        expect(token.length).toBeGreaterThan(10)
        res = await request(app).get(`/api/users/verify?token=${token}`)
        expect(res.status).toEqual(200)
        expect(res.body.msg).toEqual("Your account is now activated")
    })

    it('fails if no token provided', async () => {
        const me = getUsers()[0]
        let res = await registerUser(me)
        res = await request(app).get("/api/users/verify")
        expect(res.status).toBe(400)
    })
    it("fails if token is incorrect", async () => {
        const me = getUsers()[0]
        let res = await registerUser(me)
        res = await request(app)
        .get("/api/users/verify?token=ljdflakdfmk.dnvsdnfknsdfklnfdfdfsfjn,fsd")
        expect(res.status).toBe(400)
    })
})

describe("api/users/login", () => {
    beforeEach(dropUsers)

    afterAll(dropUsers)
    
    it("fails if not verified", async() => {
        let user = getUsers()[0]
        let res = await registerUser(user)
        expect(res.status).toEqual(201)
        res = await lgoinUser(user)        
        expect(res.status).toEqual(401)
        expect(res.body.error).toEqual("Account is not verified")
    })


    it("retrive a token", async () => {
        let [user] = getUsers(1)
        let res = await registerUser(user)
        expect(res.status).toEqual(201)
        res = await lgoinUser(user)
        expect(res.status).toEqual(200)
        expect(res.body).toHaveProperty("token")
        expect(res.body).not.toHaveProperty("password")
    })

    it("fails on wrong credentials", async () => {
        let user = getUsers(1)[0]
        let res = await registerUser(user)
        res = await lgoinUser({ email: user.email, password: user.password + "1" })
        expect(res.status).toEqual(401)
        expect(res.body).toHaveProperty("error")
        // expect(res.body.error).toIncludes("invalid email")
    })

})

describe("api/users/me", () => {

    beforeAll(dropUsers)
    afterAll(dropUsers)

    const me = getUsers(1)[0]
    // it("fail to login if account not verified"){}
    
    it("get user profile", async () => {
        let res = await registerUser(me)
        expect(res.status).toEqual(201)

        res = await lgoinUser({
            email: me.email,
            password: me.password
        })

        expect(res.status).toEqual(200)
        let token = res.body.token
        expect(typeof token).toBe("string")

        res = await request(app).get("/api/users/me").auth(token, { type: "bearer" })
        expect(res.status).toEqual(200)
        expect(res.body).toHaveProperty("email")

    })

    it("failes when no token is provided", async () => {
        const res = await request(app).get("/api/users/me")
        expect(res.status).toEqual(401)
    })

    it("failes when token is tampered", async () => {
        let res = await lgoinUser({
            email: me.email,
            password: me.password
        })

        let token = res.body.token
        token = token.replace("a", "b")        
        res = await request(app).get("/api/users/me")
        .auth(token, { type: "bearer" })
        expect(res.status).toEqual(401)
        expect(res.body.error).toEqual("Invalid token")
    })

    it("failes when token expires after 2sec", async () => {
        let token = await (await lgoinUser(me)).body.token
        expect(typeof token).toBe("string")
        setTimeout(async () => {
            let res = await request(app).get("/api/users/me").auth(token)
            expect(res.status).toEqual("401")
            expect(res.body).toHaveProperty("error")
            expect(res.body.error).toEqual("Token expired")

        }, 2500)
    })

})

describe("/api/users/logout", () => {
    beforeAll(dropUsers)
    afterAll(dropUsers)

    it("delete user token", async () => {
        process.env.JWT_EXP = "1h"
        let me = getUsers(1)[0]
        await registerUser(me)
        let token = await (await lgoinUser(me)).body.token
        // console.log(token)
        expect(typeof token).toBe("string")

        let res = await request(app)
            .post("/api/users/me/logout")
            .auth(token, { type: "bearer" })

        // console.log(res.body)
        expect(res.status).toEqual(200)
        // directly check the user document
        const user = await User.findOne({ email: me.email, 'tokens.token': token })
        expect(user).toEqual(null)

    })

})