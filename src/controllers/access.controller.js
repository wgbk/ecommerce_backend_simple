"use strict"

const { CREATED } = require("../core/success.response");
const AccessService = require("../services/access.service")

class AccessController {

    signUp = async ( req, res, next) => {
        new CREATED({
          message: "Registered OK!",
          metadata: await AccessService.signUp(req.body),
          options: {
            limit: 10
          }
        }).send(res)
    }
}

module.exports = new AccessController()