const redis = require('../src/redis')

describe('redis store', () => {
  it('shoud insert and find revoked token', async () => {
    const [jti, token] = ['jti', 'token token']

    // set on redis
    await redis.revokedTokenStore.insert(jti, token)

    const result = await redis.revokedTokenStore.find(jti)
    expect(result).toEqual(token)
  })
})
