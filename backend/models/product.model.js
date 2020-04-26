const mongoose = require('mongoose')
const schema = mongoose.Schema
const BigNumber = require('bignumber.js')

const productSchema = new schema({

    name: {
        type: String,
        required: [true, 'All products require a name']
    },
    department: {
        type: String,
        enum: ['Clothing', 'Footwear', 'Healthcare'],
        required: [true, 'All products belong to a department']
    },
    category: {
        type: String,
        required: [true, 'All products require a category']
    },
    description: {
        type: String,
        required: [true, 'Please provide some information about the product']
    },
    price: {
        type: Number,
        max: 100,
        required: [true, 'Please enter a price for this product']
    },
    onSale: {
        type: Boolean,
        required: [true, 'Determine if product is a sale item']
    },
    salePrice: {
        type: Number
    }

})

const Product = mongoose.model('Product', productSchema)

module.exports = Product;