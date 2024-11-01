'use strict'

const { model, Schema, Types } = require("mongoose"); // Erase if already required

const DOCUMENT_NAME = "Cart";
const COLLECTION_NAME = "Carts";

// Declare the Schema of the Mongo model
var cartSchema = new Schema({
    cart_state:{
        type:String,
        required:true,
        enum: ['active', 'completed', 'failed', 'pending'],
        default: 'active'
    },
    cart_products: {
        type: Array,
        require: true,
        default: []
    },
    cart_count_product: {
        type: Number,
        default: 0
    },
    cart_userId: {
        type: Number,
        require: true
    }
}, {
    collection: COLLECTION_NAME,
    timestamps: {
        createdAt: 'createdOn',
        updatedAt: 'modifiedOn'
    }
});

module.exports = {
    cart: model(DOCUMENT_NAME, cartSchema)
}