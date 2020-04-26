const crypto = require('crypto')
const mongoose = require('mongoose')
const {isValidPassword} = require('mongoose-custom-validators')
const bcrypt = require('bcryptjs')

let Schema = mongoose.Schema;

const validator = require('validator')

const userSchema = new Schema({

    forename: {
        type: String,
        minLength: [2, 'A first name must have two or more characters'],
        required: [true, 'You must enter your name']
    },
    surname: {
        type: String,
        minLength: [2, 'A surname must have two or more characters'],
        required: [true, 'You must enter your name']
    },
    email: {
        type: String,
        required: [true, 'please provide your email address'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide your email address']
    },
    role: {
        type: String,
        enum: ['user', 'support', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minLength: 8,
        //Stops the password showing in any output to the client
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords are not the same'
        }

    },
    passwordChangedAt: {
        type: Date
    },
    passwordResetToken:{
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    photo: String,
    address: {
        type: String
    },
    city: {
        type: String
    },
    county: {
        type: String
    },
    country: {
        type: String
    },
    postcode: {
        type: String
    }
})

//Encryption happens between the moment the data is collected and saved
userSchema.pre('save', async function (next) {
    //This means current document. If the password has not
    //been modified return from this function and call the next middleware.
    if (!this.isModified('password')) return next();

    //Asyncronously hash the password using a cost of 12.
    this.password = await bcrypt.hash(this.password, 12);

    //deletes the field so it does not persist in the database
    this.passwordConfirm = undefined;

    next();

})

userSchema.pre('save', function (next) {
    //If the password has not been modified or if the document is new then return next
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
})

userSchema.methods.createPasswordResetToken =  function() {
    //This creates the reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    //This encrypts the reset token to prevent any vulnerabilities in the database being exposed.
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');


    //Converts the time into milliseconds
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000




    return resetToken;


}


//Goal to return true if passwords are the same and false if not
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    //Bcrypt used to compare the two passwords. userPassword needed as a parameter as this.password
    //unavailable as select set to false so password not returned to the client.
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if(this.passwordChangedAt){
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime()  / 1000, 10)

        console.log(changedTimestamp, JWTTimestamp)

        return JWTTimestamp < changedTimestamp;
    }

    return false;
}

const User = mongoose.model('User', userSchema)

module.exports = User;

