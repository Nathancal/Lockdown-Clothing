class AppError extends Error{

    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        //Means that all errors we create ourselves are operational errors. ie third party errors dont need this
        //or need to have anything sent to the client therefore not set to true.
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = AppError;