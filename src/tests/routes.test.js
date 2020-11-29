const app = require("../app")
const User = require("../models/User")
const request = require("supertest")

const api = "/api/users"
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

    beforeEach(async () => {
        await User.deleteMany({})
    })

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


const lgoinUser = async (cred) => {
    return await request(app).post("/api/users/login").send(cred)
}
describe("api/users/login", () => {
    beforeEach(async () => {
        await User.deleteMany({})
    })

    it("retrive a token", async () => {
        let [ user ] = getUsers(1)
        let res = await registerUser(user)
        expect(res.status).toEqual(201)
        res = await lgoinUser({ email: user.email, password: user.password })
        expect(res.status).toEqual(200)
        expect(res.body).toHaveProperty("token")
        expect(res.body).not.toHaveProperty("password")
    })

    it("fails on wrong credentials", async () => {
        let user = getUsers(1)[0]
        let res = await registerUser(user)
        res = await lgoinUser({ email: user.email, password: user.password+"1" })
        expect(res.status).toEqual(401)
        expect(res.body).toHaveProperty("error")
        // expect(res.body.error).toIncludes("invalid email")
    })
})