'use strict'

const { product, electronic, clothing, furniture } = require('../../models/product.model')
const { Types } = require('mongoose')

const findAllDraftForShop = async({query, limit, skip}) => {
    return await queryProduct({ query, limit, skip });
}

const findAllPublishForShop = async ({ keySearch }) => {
    const regexSearch = new RegExp(keySearch)
    const results = await product.find({
        isPublish: true,
        $text: { $search: regexSearch }
    },{score: { $meta: 'textScore' }})
    .sort({score: { $meta: 'textScore' }}).lean()

    return results;
};

const searchProductByUser = async ({ query, limit, skip }) => {
  return await queryProduct({ query, limit, skip });
};

const publishProductByShop = async({ product_shop, product_id }) => {
    const foundShop = await product.findOne({
        product_shop: new Types.ObjectId(product_shop),
        _id: new Types.ObjectId(product_id)
    })
    if(!foundShop) return null
    foundShop.isDraft = false
    foundShop.isPublish = true
    const { modifiedCount } = await foundShop.update(foundShop)

    return modifiedCount
}

const unPublishProductByShop = async ({ product_shop, product_id }) => {
  const foundShop = await product.findOne({
    product_shop: new Types.ObjectId(product_shop),
    _id: new Types.ObjectId(product_id),
  });
  if (!foundShop) return null;
  foundShop.isDraft = true;
  foundShop.isPublish = false;
  const { modifiedCount } = await foundShop.update(foundShop);

  return modifiedCount;
};

const queryProduct = async ({ query, limit, skip }) => {
    return await product
      .find(query)
      .populate("product_shop", "name email -_id")
      .sort({ updateAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
}

module.exports = {
  findAllDraftForShop,
  findAllPublishForShop,
  publishProductByShop,
  unPublishProductByShop,
  searchProductByUser,
};