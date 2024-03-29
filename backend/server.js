const mongoose = require('mongoose');
const dotenv = require('dotenv');


process.on('uncaughtException', err => {

    console.log('UNCAUGHT EXCEPTION! Shutting Down...');
    console.log(err.name, err.message);
        process.exit(1);
});

dotenv.config({path: './config.env'});


const app = require('./app');

mongoose.connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => console.log('DB connection successful'));

const port = process.env.PORT || 3000;

const server = app.listen(port, () =>{
    console.log(`App is running on port ${port}`)
})

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! Shutting Down...');
    console.log(err.name, err.message);

    //Gives the server time to finish the requests pending. server only killed
    //after that.
    server.close(() =>{
        process.exit(1);

    })
})


//TEST