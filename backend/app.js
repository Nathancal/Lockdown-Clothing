var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const AppError = require('./utilities/app.error');
const globalErrorHandler = require('./controllers/error.controller');
var userRouter = require('./routes/user.router');
var productRouter = require('./routes/product.router');


var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res,next) => {
    req.requestTime = new Date().toISOString()
    console.log(req.headers)
    next();
})


app.use((req, res, next) =>{

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
    res.setHeader('Acces-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')

    next();
})

app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Cant find ${req.originalUrl} on the server`, 400));
});

app.use(globalErrorHandler)

module.exports = app;
