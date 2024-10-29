"use strict";

const { model, Schema, Types } = require("mongoose"); // Erase if already required

const DOCUMENT_NAME = "Discount";
const COLLECTION_NAME = "Discounts";

// Declare the Schema of the Mongo model
var discountSchema = new Schema(
  {
    discount_name: {
        type: String,
        require: true
    },
    discount_description: {
        type: String,
        require: true
    },
    discount_type: {
        type: String,
        default: 'fixed_amount' //percentage
    },
    discount_value: {
        type: Number,
        require: true
    },
    discount_code: {
        type: String,
        require: true
    },
    discount_start_date: {
        type: Date,
        require: true
    },
    discount_end_date: {
        type: Date,
        require: true
    },
    discount_max_uses: {
        type: Number,
        require: true
    },
    discount_uses_count: {
        type: Number,
        require: true
    },
    discount_users_used: {
        type: Array,
        default: []
    },
    discount_max_uses_per_user: {
        type: Number,
        require: true
    },
    discount_min_order_value: {
        type: Number,
        require: true
    },
    discount_max_value: {
        type: Number
    },
    discount_shopId: {
        type: Schema.Types.ObjectId,
        ref: 'Shop'
    },
    discount_is_active: {
        type: Boolean,
        default: true
    },
    discount_applies_to: {
        type: String,
        require: true,
        enum: ['all', 'specific']
    },
    discount_product_ids: {
        type: Array,
        default: []
    }
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

//Export the model
module.exports = model(DOCUMENT_NAME, discountSchema);
