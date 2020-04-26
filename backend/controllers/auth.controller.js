const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/user.model');
const catchAsync = require('./../utilities/catchAsync.util')
const AppError = require('./../utilities/app.error');

const signToken = id => {
    return jwt.sign({id: id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        forename: req.body.forename,
        surname: req.body.surname,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt
    })

    if(!req.body.forename ||  !req.body.surname || !req.body.email || !req.body.password || !req.body.passwordConfirm){

        return next(new AppError('You have left one or more of the required fields empty, please check and try again.', 401))
    }

    //The object/payload we want to put into the web token.
    const token = signToken(newUser._id);

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    })
})

exports.login = catchAsync( async (req, res, next) => {

    const {email, password} = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {

        return next(new AppError('Please provide both an email and a password to login.', 400))
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({email}).select('+password');

    //if user doesnt exist or password is incorrect throw the error
    if(!user || !(await user.correctPassword(password, user.password))){
        return next(new AppError('Incorrect Email or Password', 401))
    }

    // 3) If everything ok send token to the client
    const token =  signToken(user._id);
    res.status(200).json({
        status: 'success',
        userId: user._id,
        email: user.email,
        token
    })

})

//middleware that protects certain routes from access
exports.protect = catchAsync(async (req, res, next) =>{
    // 1) Getting token and checking if it exists
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        //Splits the array and takes the second element and applies it to the token
        token = req.headers.authorization.split(' ')[1]
    }

    if(!token){
        return next(new AppError('You are not logged in! Please log in to get access', 401))
    }

    // 2) Verification token //ASYNC//
    //This is a function that we call that returns a promise
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if(!currentUser){
        return next(new AppError('The user belonging to this token does no longer exist', 401))
    }

    // 4) Check if user changed password after the JWT was issued
    if(currentUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User recently changed password! Please log in again.', 401))
    }

    //Grants access to the protected route by leading to the next middleware
    req.user = currentUser
    next();
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        //roles is array accessible through a closure
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action', 403))
        }

        next();
    }
}
