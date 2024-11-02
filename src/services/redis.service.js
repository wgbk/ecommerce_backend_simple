'use strict'

const redis = require('redis')
const { promisify } = require('util')
const { reservationInventory } = require('../models/repositories/inventory.repo')
const redisClient = redis.createClient()

const pExpire = promisify(redisClient.pExpire).bind(redisClient)
const setNxAsync = promisify(redisClient.setNX).bind(redisClient)

const acquireLock = async (productId, quantity, cartId) => {
    const key = `lock_v2024_${productId}`
    const retryTime = 10
    const expireTime = 3000 // 3 second for lock

    for (let i = 0; i < retryTime; i++) {
      // create a key, will payment for who have
      const result = await setNxAsync(key, expireTime); // 1: success, 0: fail
      if (result === 1) {
        // inventory
        const isReservation = await reservationInventory({
          productId, quantity, cartId
        })
        if (isReservation.modifiedCount) {
          await pExpire(key, expireTime);
          return key
        }
        return null
      } else {
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }
}

const releaseLock = async keyLock => {
  const delAsyncKey = promisify(redisClient.del).bind(redisClient)
  return await delAsyncKey(keyLock)
}

module.exports = {
  acquireLock,
  releaseLock
}