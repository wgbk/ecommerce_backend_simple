'use strict'

const shopModel = require("../models/shop.model")
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const KeyTokenService = require("./keyToken.service")
const { createTokenPair, verifyJWT } = require("../auth/authUtils")
const { getInfoData } = require("../utils")
const { BadRequestError, AuthFailureError, ForBiddenError } = require("../core/error.response")
const { findByEmail } = require("./shop.service")

const RoleShop = {
    SHOP: 'SHOP',
    WRITER: 'WRITER',
    EDITOR: 'EDITOR',
    ADMIN: 'ADMIN'
}

class AccessService {

    /*
        check this token used?
    */
    static handlerRefreshToken = async (refreshToken ) => {
      const foundToken = await KeyTokenService.findByRefreshTokenUsed(refreshToken)
      if(foundToken) {
        //decode user
        const { userId, email } = await verifyJWT(refreshToken, foundToken.privateKey)
        await KeyTokenService.deleteKeyById(userId)
        throw new ForBiddenError('Something wrong happened! Please re-login')
      }
      const holderToken = await KeyTokenService.findByRefreshToken(refreshToken)
      if(!holderToken) throw new AuthFailureError('Shop not registered!')
      const { userId, email } = await verifyJWT(
        refreshToken,
        holderToken.privateKey
      )
      const foundShop = await findByEmail({email})
      if(!foundShop) throw new AuthFailureError("Shop not registered!")
      const tokens = await createTokenPair(
        { userId, email },
        holderToken.publicKey,
        holderToken.privateKey
      )
      await holderToken.update({
        $set: {
          refreshToken: tokens.refreshToken
        },
        $addToSet: {
          refreshTokenUsed: refreshToken
        }
      })

      return {
        user: {userId, email},
        tokens
      }
    }

    static logout = async(keyStore) => {
        const delKey = await KeyTokenService.removeKeyById(keyStore._id)
        return delKey
    }

    /*
        1 - check email in dbs
        2 - match password
        3 - create AT and RT and save
        4 - generate tokens
        5 - get data return logins
    */
    static login = async ({email, password, refreshToken = null}) => {
        const foundShop = await findByEmail({email})
        if (!foundShop) throw new BadRequestError('Shop not registered!')

        const match = bcrypt.compare(password, foundShop.password)
        if(!match) throw new AuthFailureError('Authentication error')

        const privateKey = crypto.randomBytes(64).toString("hex");
        const publicKey = crypto.randomBytes(64).toString("hex");
        const { _id: userId } = foundShop

        const tokens = await createTokenPair(
          { userId, email },
          publicKey,
          privateKey
        );

        await KeyTokenService.createKeyToken({
            refreshToken: tokens.refreshToken,
            privateKey,
            publicKey,
            userId
        })
        return {
          shop: getInfoData({
            fields: ["_id", "name", "email"],
            object: foundShop,
          }),
          tokens
        };
    }

    static signUp = async ({ name, email, password }) => {
        const holderShop = await shopModel.findOne({ email }).lean();
        if (holderShop) {
          throw new BadRequestError("Error: Shop already registered!");
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newShop = await shopModel.create({
          name,
          email,
          password: passwordHash,
          roles: [RoleShop.SHOP],
        });

        if (newShop) {
          // const { privateKey, publicKey } = crypto.generateKeyPairSync(
          //   "rsa",
          //   {
          //     modulusLength: 4096,
          //     publicKeyEncoding: {
          //       type: "pkcs1",
          //       format: "pem",
          //     },
          //     privateKeyEncoding: {
          //       type: "pkcs1",
          //       format: "pem",
          //     }
          //   }
          // );
          const privateKey = crypto.randomBytes(64).toString("hex");
          const publicKey = crypto.randomBytes(64).toString("hex");

          const keyStore = await KeyTokenService.createKeyToken({
            userId: newShop._id,
            publicKey,
            privateKey,
          });

          if (!keyStore) {
            throw new BadRequestError("Error: keyStore error!");
          }

          const tokens = await createTokenPair(
            { userId: newShop._id, email },
            publicKey,
            privateKey
          );
          console.log(`Created Token Success::`, tokens);

          return {
            code: 201,
            metadata: {
              shop: getInfoData({
                fields: ["_id", "name", "email"],
                object: newShop,
              }),
              tokens,
            },
          };
        }

        return {
          code: 200,
          metadata: null,
        };
    }
}

module.exports = AccessService