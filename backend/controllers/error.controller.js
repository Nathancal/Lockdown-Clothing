const AppError = require('./../utilities/app.error');

//Overrides the mongoose error with a nicer to read message describing the cast
//error
const handleCastErrorDB = (err) =>{
    const message = `Invalid ${err.path}: ${err.value}.`
    return new AppError(message, 400);
}

const handleJWTError = err => new AppError('Invalid token. Please log in again!', 401)

const handleJWTExpiredError = err => new AppError('Your token has expired! Please log in again', 401);

const handleDuplicateFieldsDB = (err) => {

    const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)

    console.log(value)
    const message = `Duplicate field value: ${value}. Please use another value`;
    return new AppError(message, 400);
}

const handleValidationErrorDB = (err) =>{
    const errors = Object.values(err.errors).map(el => el.message)

    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);

}

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

//Limits the scope of the error message sent when the application is in
//production.
const sendErrorProd = (err, res) => {
    //Trusted operational error therefore the message is sent to the client.
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        })
        //Unknown error so the details are not leaked to the client.
    } else {

        console.error('ERROR: ', err)

        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong here.'
        })
    }


}

module.exports = (err, req, res, next) => {
    console.log(err.stack);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res)
    } else if (process.env.NODE_ENV === 'production') {

        let error = {...err};

        //Checks for a cast error then carries out the handlecasterror function
        //if one is found.
        if(error.name === 'CastError') error = handleCastErrorDB(error);
        if(error.code === 11000) error = handleDuplicateFieldsDB(error);
        if(error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if(error.name === 'JsonWebTokenError') error = handleJWTError(error);
        if(error.name === 'TokenExpiredError') error = handleJWTExpiredError(error)

        sendErrorProd(error, res)
    }


};