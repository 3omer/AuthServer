/* eslint-disable no-undef */
// test user model
require('dotenv').config()

process.env.MONGODB_URL = 'mongodb://localhost/test'
if (process.env.NODE_ENV !== 'test') {
  throw new Error(`NODE_ENV is ${process.env.NODE_ENV}`)
}

require('../src/db/db')
const User = require('../src/models/User')

describe('User Model', () => {
  let dummbyUser
  beforeEach(async () => {
    await User.deleteMany({})

    // valid user for re-use
    dummbyUser = {
      username: 'testuser',
      password: 'testuser',
      email: 'testuser@test.com',
    }
  })
  afterAll(async () => {
    await User.deleteMany({})
    await User.db.close()
  })

  it('should hash passowrd before save', async () => {
    await new User(dummbyUser).save()
    const result = await User.findOne()
    expect(result).toHaveProperty('_id')
    expect(result.password.length).toBeGreaterThan(20)
  })

  it('should genarate tokens', async () => {
    await new User(dummbyUser).save()
    const user = await User.findOne()
    const token = await user.generateToken()
    expect(token).toEqual(expect.any(String))
  })

  it('should find a user by his credentilas', async () => {
    await new User(dummbyUser).save()
    const user = await User.findByCredentials(
      dummbyUser.email,
      dummbyUser.password
    )
    expect(user.username).toEqual(dummbyUser.username)
    const fasly = await User.findByCredentials(dummbyUser.email, '12312313')
    expect(fasly).toBe(null)
  })
})
