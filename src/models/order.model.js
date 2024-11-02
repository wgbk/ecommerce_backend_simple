"use strict";

const { model, Schema, Types } = require("mongoose"); // Erase if already required

const DOCUMENT_NAME = "Order";
const COLLECTION_NAME = "Orders";

// Declare the Schema of the Mongo model
var orderSchema = new Schema(
  {
    order_userId: {
        type: Number,
        require: true
    },
    order_checkout: {
        type: Object,
        default: {}
    },
    /*
        order_checkout: {
            totalPrice,
            totalApplyDiscount,
            feeShip
        }
    */
    order_shipping: {
        type: Object,
        default: {}
    },
    /*
        street,
        city,
        state,
        country
    */
    order_payment: {
        type: Object,
        default: {}
    },
    order_products: {
        type: Array,
        require: true
    },
    order_trackingNumber: {
        type: String,
        default: '#0000102112024'
    },
    order_status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'canceled', 'delivered'],
        default: 'pending'
    }
  },
  {
    collection: COLLECTION_NAME,
    timestamps: {
      createdAt: "createdOn",
      updatedAt: "modifiedOn",
    },
  }
);

module.exports = {
  order: model(DOCUMENT_NAME, orderSchema),
};
