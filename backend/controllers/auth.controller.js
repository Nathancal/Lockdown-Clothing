const crypto = require('crypto');
const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/user.model');
const catchAsync = require('./../utilities/catchAsync.util')
const AppError = require('./../utilities/app.error');
const sendEmail = require('./../utilities/email.util');


const signToken = id => {
    return jwt.sign({id: id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, res)=>{
    const token = signToken(user._id);

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user: user
        }
    })

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

    if (!req.body.forename || !req.body.surname || !req.body.email || !req.body.password || !req.body.passwordConfirm) {

        return next(new AppError('You have left one or more of the required fields empty, please check and try again.', 401))
    }

    //The object/payload we want to put into the web token.
    createSendToken(newUser, 201, res)

})

exports.login = catchAsync(async (req, res, next) => {

    const {email, password} = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {

        return next(new AppError('Please provide both an email and a password to login.', 400))
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({email}).select('+password');

    //if user doesnt exist or password is incorrect throw the error
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect Email or Password', 401))
    }

    // 3) If everything ok send token to the client
    createSendToken(user, 201, res)

})

//middleware that protects certain routes from access
exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and checking if it exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        //Splits the array and takes the second element and applies it to the token
        token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access', 401))
    }

    // 2) Verification token //ASYNC//
    //This is a function that we call that returns a promise
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token does no longer exist', 401))
    }

    // 4) Check if user changed password after the JWT was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please log in again.', 401))
    }

    //Grants access to the protected route by leading to the next middleware
    req.user = currentUser
    next();
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        //roles is array accessible through a closure
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403))
        }

        next();
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {

    //GEt user based on POSTed email
    const user = await User.findOne({email: req.body.email})
    if (!user) {
        return next(new AppError('There is no user with this email address', 404))
    }

    //Generate the random reset token
    const resetToken = user.createPasswordResetToken()

    //This removes the validators that are specified in the schema
    await user.save({validateBeforeSave: false})

    //Send token to the users email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${resetToken}`

    const message = `Forgot your password? Submit a PATCH request with your new password and password confirm to ${resetURL}.\n 
    If not ignore the email!`

    try {
        await sendEmail({
            from: `noreply@lockdownclothing.co.uk`,
            email: user.email,
            subject: 'Your password reset token (valid for 10 minutes)',
            message
        })

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        })
    } catch (e) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false})

        return next(new AppError('There was an error sending the email try again later', 500))
    }


})

exports.resetPassword = catchAsync(async (req, res, next) => {

    //Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    //finds the user associated with the token and also checks to ensure that the token has not expired
    const user = await User.findOne(
        {
            passwordResetToken: hashedToken,
            passwordResetExpires: {$gt: Date.now()}
        })

    //If token has not expired, and there is a user, set the new password
    if(!user){
        return next(new AppError('Token is invalid or has expired', 400))
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    //Removes the token after new password is confirmed.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    //update changedPasswordAt property for the user //TODO


    //log the user in, send JWT
    createSendToken(user, 201, res)


})

exports.updatePassword = async  (req, res, next) =>{
    //Get user from collection
    const user = await User.findById(req.body.token)

    //Check if POSTed current password is correct
    if(!(await user.correctPassword(req.body.passwordConfirm, user))){
        return next(new AppError('Password does not match current password'), 401)
    }

    //If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm

    //findbyandupdate wont work properly as it wont be secure.

    await user.save();

    //Log user in, send JWT
    createSendToken(user, 201, res)


}
