"use strict";

const InventoryService = require("../services/inventory.service");
const { SuccessResponse } = require("../core/success.response");

class InventoryController {

  addStockToInventory = async (req, res, next) => {
    new SuccessResponse({
      message: "Create new Cart success",
      metadata: await InventoryService.addStockToInventory(req.body),
    }).send(res);
  };
}

module.exports = new InventoryController();
