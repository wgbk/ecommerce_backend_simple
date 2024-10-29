'use strict'

const { BadRequestError, NotFoundError } = require("../core/error.response")
const discount = require("../models/discount.model");
const { findAllDiscountCodesUnSelect, checkDiscountExists, findAllDiscountCodesSelect } = require("../models/repositories/discount.repo");
const { findAllProducts } = require("../models/repositories/product.repo");
const { convertToObjectIdMongodb } = require("../utils")

/*
    Discount Services
    1 - Generator Discount Code [Shop|Admin]
    2 - Get discount amount [User]
    3 - Get all discount codes [User|Shop]
    4 - Verify discount code [User]
    5 - Delete discount code [Admin|Shop]
    6 - Cancel discount code [User]
*/

class DiscountService {

    static async createDiscountCode (payload) {
        const {
          code,
          start_date,
          end_date,
          is_active,
          shopId,
          min_order_value,
          product_ids,
          applies_to,
          name,
          description,
          type,
          value,
          max_value,
          max_uses,
          uses_count,
          users_used, 
          max_uses_per_user,
        } = payload;

        if (new Date(start_date) >= new Date(end_date)) {
            throw new BadRequestError("Start date must be before end date")
        }

        //create index for discount
        const foundDiscount = await discount.findOne({
            discount_code: code,
            discount_shopId: convertToObjectIdMongodb(shopId)
        }).lean()

        if(foundDiscount && foundDiscount.discount_is_active) {
            throw new BadRequestError('Discount exist!')
        }

        const newDiscount = await discount.create({
            discount_name: name,
            discount_description: description,
            discount_type: type,
            discount_code: code,
            discount_value: value,
            discount_min_order_value: min_order_value || 0,
            discount_max_value: max_value,
            discount_start_date: new Date(start_date),
            discount_end_date: new Date(end_date),
            discount_max_uses: max_uses,
            discount_uses_count: uses_count,
            discount_users_used: users_used,
            discount_shopId: shopId,
            discount_max_uses_per_user: max_uses_per_user,
            discount_is_active: is_active,
            discount_applies_to: applies_to,
            discount_product_ids: applies_to === 'all' ? [] : product_ids
        })

        return newDiscount
    }

    static async updateDiscountCode() {
        //TODO
    }

    /*
        Get all discount codes available with products
    */
   static async getAllDiscountCodesWithProduct({
        code, shopId, userId, limit = 50, page = 1
   }) {
        const foundDiscount = await discount
          .findOne({
            discount_code: code,
            discount_shopId: convertToObjectIdMongodb(shopId),
          }).lean(); 

        if (!foundDiscount || !foundDiscount.discount_is_active) {
            throw new NotFoundError('Discount not exist!')
        }

        const { discount_applies_to, discount_product_ids } = foundDiscount
        let products
        if (discount_applies_to === 'all') {
            products = await findAllProducts({
                filter: {
                    product_shop: convertToObjectIdMongodb(shopId),
                    isPublished: true
                },
                limit: +limit,
                page: +page,
                sort: 'ctime',
                select: ['product_name']
            })
        }

        if (discount_applies_to === 'specific') {
            products = await findAllProducts({
                filter: {
                    _id: {$in: discount_product_ids},
                    isPublished: true,
                },
                limit: +limit,
                page: +page,
                sort: "ctime",
                select: ["product_name"],
            });
        }

        return products
   }

   /*
        Get all discount code of Shop
   */
  static async getAllDiscountCodesByShop({
    limit = 50, page = 1, shopId
  }){
    const discounts = await findAllDiscountCodesSelect({
      limit: +limit,
      page: +page,
      filter: {
        discount_shopId: convertToObjectIdMongodb(shopId),
        discount_is_active: true,
      },
      select: ["discount_code", "discount_name"],
      model: discount
    });

    return discounts
  }

  /*
    Apply Discount Code
  */
  static async getDiscountAmount({
    codeId, userId, shopId, products
  }) {
    const foundDiscount = await checkDiscountExists({
        model: discount,
        filter: {
            discount_code: codeId,
            discount_shopId: convertToObjectIdMongodb(shopId)
        }
    })

    if(!foundDiscount) {
        throw new NotFoundError(`discount doesn't exist`)
    }

    const {
        discount_is_active,
        discount_max_uses,
        discount_min_order_value,
        discount_start_date,
        discount_end_date,
        discount_max_uses_per_user,
        discount_users_used,
        discount_type,
        discount_value
    } = foundDiscount

    if (!discount_is_active) throw new NotFoundError(`discount expired!`)
    if (!discount_max_uses) throw new NotFoundError(`discount are out!`)

    // if (new Date() < new Date(discount_start_date) || new Date() > new Date(discount_end_date)) {
    //   throw new NotFoundError(`discount code has expired`)
    // }

    let totalOrders
    if (discount_min_order_value > 0) {
      totalOrders = products.reduce((acc, product) => {
        return acc + (product.quantity * product.price)
      }, 0)

      if (totalOrders < discount_min_order_value) {
        throw new NotFoundError(`discount requires a minimum order value of ${discount_min_order_value}`)
      }
    }

    if (discount_max_uses_per_user > 0) {
      const userUsedDiscount = discount_users_used.find(user => user.userId === userId)
      if (userUsedDiscount) {
        //TODO
      }
    }

    const amount = discount_type === 'fixed_amount' ? discount_value : totalOrders * (discount_value / 100)

    return {
      totalOrders,
      discount: amount,
      totalPrice: totalOrders - amount
    }
  }

  /*
    - temporary
    - should remove to other db, not delete
  */
  static async deleteDiscountCode({
    shopId, codeId
  }) {
    const deleted = await discount.findOneAndDelete({
      discount_code: codeId,
      discount_shopId: convertToObjectIdMongodb(shopId)
    })

    return deleted
  }

  static async cancelDiscountCode({ codeId, shopId, userId }) {
    const foundDiscount = await checkDiscountExists({
      model: discount,
      filter: {
        discount_code: codeId,
        discount_shopId: convertToObjectIdMongodb(shopId)
      }
    })

    if (!foundDiscount) {
      throw new NotFoundError(`discount doesn't exist`)
    }

    const result = await discount.findByIdAndUpdate(foundDiscount._id, {
      $pull: {
        discount_users_used: userId
      },
      $inc: {
        discount_max_uses: 1,
        discount_uses_count: -1
      }
    })

    return result
  }
}

module.exports = DiscountService