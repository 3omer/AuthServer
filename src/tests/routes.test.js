const app = require("../app")
const User = require("../models/User")
const request = require("supertest")

const api = "/api/users"
const getUsers = (limit) => {
    // list of user up to limit, default is 5
    limit = !limit ? 5: limit
    let users = []
    for (let i=1; i <= limit; i++) {
        let username = "test" + i.toString()
        users.push({
            username: username,
            email: username + "@test.com",
            password: username + "123"
        })
    }
    return users
}

const registerUser = async(user) => {
    return await request(app).post(api).send(user)
}

describe("Users endpoints", () => {  

    beforeEach(async () => {
        await User.deleteMany({})
    })

    afterAll(async () => {
        // TODO: tear down the app gracefully
        // await User.db.close()
        // await request.close()
    })


    it("create a new user, retrive user + token", async() => {
        let user = getUsers()[0]
        const res = await registerUser(user)
        expect(res.status).toEqual(201)
        expect(res.body).toHaveProperty("token")
        // password hash is not exposed
        expect(res.body).not.toHaveProperty("password")
    })

    it("reject duplicate email", async() => {
        let [ user ]  = getUsers(1)
        const res = await registerUser(user)
        expect(res.status).toEqual(201)
        const res2 = await registerUser(user)
        expect(res2.status).toEqual(400)

    })

    it("reject nonvalid email", async() => {
        let [ user ] = getUsers(1)
        user.email = "notreallyandemail@.com"

        const res = await registerUser(user)
        expect(res.status).toEqual(400)
        // expect(res.body.error).toIncludes("invalid")

    })

    it("reject short password", async() => {
        let [ user ] = getUsers(1)
        user.password="short"
        const res = await registerUser(user)
        expect(res.status).toEqual(400)
    })
})