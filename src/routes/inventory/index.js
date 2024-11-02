"use strict";

const express = require("express");
const inventoryController = require("../../controllers/inventory.controller");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { authenticationV2 } = require("../../auth/authUtils");
const router = express.Router();

// authentication //
router.use(authenticationV2);
////////////////////

router.post("", asyncHandler(inventoryController.addStockToInventory));

module.exports = router;
