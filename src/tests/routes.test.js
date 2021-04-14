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


    it("create a new user, retrive user object", async () => {
        let user = getUsers()[0]
        const res = await registerUser(user)
        expect(res.status).toEqual(201)
        expect(res.body.user).toHaveProperty("id")
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


const loginUser = async (user) => {
    return request(app).post("/api/users/login").send({
        email: user.email,
        password: user.password
    })
}

const utils = require("../utils")

const verifyAccount = async (user) => {
    const token = utils.generateVerifLink(user).split("token=")[1]
    return request(app).get(`/api/users/verify?token=${token}`)
}

describe("/api/users/verify", () => {
    beforeEach(dropUsers)
    it("activate account when called with valid token", async () => {

        const me = getUsers()[0]
        // register
        let res = await registerUser(me)
        expect(res.status).toEqual(201)
        // verify
        res = await verifyAccount(res.body.user)
        expect(res.status).toEqual(200)
        expect(res.body.msg).toEqual("Your account is now activated")
    })

    it('fails if no token provided', async () => {
        const me = getUsers()[0]
        // register
        let res = await registerUser(me)
        // verify
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
        res = await loginUser(user)        
        expect(res.status).toEqual(401)
        expect(res.body.error).toEqual("Account is not verified")
    })


    it("login and get token", async () => {
        let [user] = getUsers(1)
        // register
        let res = await registerUser(user)
        expect(res.status).toEqual(201)
        // verify account
        res = await verifyAccount(res.body.user)
        expect(res.status).toEqual(200)
        // login
        res = await loginUser(user)
        expect(res.status).toEqual(200)
        expect(res.body).toHaveProperty("token")
        expect(res.body).not.toHaveProperty("password")
    })

    it("fails on wrong credentials", async () => {
        let user = getUsers(1)[0]
        let res = await registerUser(user)
        res = await loginUser({ email: user.email, password: user.password + "1" })
        expect(res.status).toEqual(401)
        expect(res.body).toHaveProperty("error")
        // expect(res.body.error).toIncludes("invalid email")
    })

})

describe("api/users/me", () => {

    beforeAll(dropUsers)
    afterAll(dropUsers)

    const me = getUsers(1)[0]
    
    it("get user profile", async () => {
        // register
        let res = await registerUser(me)
        expect(res.status).toEqual(201)
        // verify
        res = await verifyAccount(res.body.user)
        expect(res.status).toEqual(200)
        // login
        res = await loginUser({
            email: me.email,
            password: me.password
        })

        expect(res.status).toEqual(200)
        let token = res.body.token
        expect(typeof token).toBe("string")

        res = await request(app).get("/api/users/me").auth(token, { type: "bearer" })
        expect(res.status).toEqual(200)
        expect(res.body.user).toHaveProperty("email")

    })

    it("failes when no token is provided", async () => {
        const res = await request(app).get("/api/users/me")
        expect(res.status).toEqual(401)
    })

    it("failes when token is tampered", async () => {
        let res = await loginUser({
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
        let res =  await loginUser(me)
        let token = res.body.token
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
        let me = getUsers(1)[0]
        // register
        let res = await registerUser(me)
        
        // verifiy
        res = await verifyAccount(res.body.user)
        expect(res.status).toBe(200)
        // login
        res = await loginUser(me)
        let token = res.body.token

        // console.log(token)
        expect(typeof token).toBe("string")
        
        // logout
        res = await request(app)
            .post("/api/users/me/logout")
            .auth(token, { type: "bearer" })

        // console.log(res.body)
        expect(res.status).toEqual(200)
        // check token id is added to invoked tokens list
        const user = await User.findOne({ email: me.email})
        expect(user.invokedTokens.length).toEqual(1)
        
        // enusre token is invoked
        res = await request(app)
        .get('/api/users/me')
        .auth(token, { type: 'bearer' })

        expect(res.status).toEqual(400)
        expect(res.body.error).toEqual("Token has been invoked")

    })

})