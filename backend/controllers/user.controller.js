const fs = require('fs')
const User = require('./../models/user.model')
const queryChecker = require('./querystrings.controller');
const pagination = require('./pagination.controller');
const catchAsync = require('./../utilities/catchAsync.util');
const checkById = require('./../utilities/checkForId.util');


exports.createUser = catchAsync(async (req, res, next) => {
    try {
        const newUser = await User.create(req.body)

        res.status(201).json({
            status: 'success',
            data: {
                user: newUser
            }
        })

    } catch (err) {
        res.status(400).json({
            status: 'failed',
            message: err
        })
    }
})

exports.getAllUsers = catchAsync(async (req, res, next) => {

    //Filtering
    const queryObj = {...req.query}
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el])

    //Advanced filtering
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
    console.log(JSON.parse(queryString))

    let query = User.find(JSON.parse(queryString));

    //Sort and field limiting
    query = queryChecker.checkStrings(req.query, query);

    //Checks the pagination
    query = pagination.paginate(req.query, query, User);

    const Users = await query;

    console.log(Users.toString())

    res.status(200).json({
        status: 'success',
        results: Users.length,
        data: {
            Users
        }
    })


})

exports.getUser = catchAsync(async (req, res, next) => {

    const userFound = await User.findById(req.params.id);

    checkById.checkForId(userFound, next);

    res.status(200).json({
        status: 'success',
        data: {
            userFound
        }
    })


})

exports.updateUser = catchAsync(async (req, res, next) => {

    const userUpdated = await User.findByIdAndUpdate(req.params.id, req.body, {
        //Returns the updated document
        new: true,
        runValidators: true
    });

    checkById.checkForId(userUpdated, next);

    res.status(200).json({
        status: 'success',
        data: {
            user: userUpdated
        }
    })

})

exports.deleteUser = catchAsync(async (req, res, next) => {
    await User.findByIdAndDelete(req.params.id);

    checkById.checkForId(userUpdated, next);

    res.status(204).json({
        status: 'success',
        data: null
    })

})