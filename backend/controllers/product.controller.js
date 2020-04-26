const fs = require('fs');
const Product = require('./../models/product.model');
const queryChecker = require('./querystrings.controller');
const pagination = require('./pagination.controller')

const AppError = require('./../utilities/app.error');
const catchAsync = require('./../utilities/catchAsync.util');
const checkById = require('./../utilities/checkForId.util');


exports.createProduct = catchAsync(
    async (req, res, next) => {
        const newProduct = await Product.create(req.body)

        res.status(200).json({
            status: 'success',
            data: {
                product: newProduct
            }
        })
    }
)

exports.getAllProducts = catchAsync(async (req, res, next) => {

    //Filtering
    const queryObj = {...req.query};
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);


    //Advanced filtering
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
    console.log(JSON.parse(queryString));


    let query = Product.find(JSON.parse(queryString));


    query = queryChecker.checkStrings(req.query, query);

    //Checks the pagination
    query = pagination.paginate(req.query, query, Product);

    const getProducts = await query;

    res.status(200).json({
        status: 'success',
        results: getProducts.length,
        data: {
            getProducts
        }
    })
})

exports.getProduct = catchAsync(async (req, res, next) => {
    const getProduct = await Product.findById(req.params.id);

    checkById.checkForId(getProduct, next);

    res.status(200).json({
        status: 'success',
        data: {
            getProduct
        }
    })

})

exports.updateProduct = catchAsync(async (req, res, next) => {

    const productUpdated = await Product.findByIdAndUpdate(req.params.id, req.body, {
        //Returns the updated document
        new: true,
        runValidators: true
    });

    checkById.checkForId(productUpdated, next);


    res.status(200).json({
        status: 'success',
        data: {
            user: productUpdated
        }
    })

})

exports.deleteProduct = catchAsync(async (req, res, next) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);

        checkById.checkForId(deletedProduct, next);


        res.status(200).json({
            status: 'success',
            data: {
                user: deletedProduct
            }
        })
    } catch (err) {
        res.status(400).json({
            status: 'failed',
            message: err
        })

    }
})