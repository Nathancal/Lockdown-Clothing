const express = require('express');
const userController = require('./../controllers/user.controller');
const authController = require('./../controllers/auth.controller');


const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotpassword', authController.forgotPassword);
//better to use patch for this than post
router.patch('/resetpassword/:token', authController.resetPassword)

router.patch('/updatemypassword', authController.protect, authController.updatePassword)

router
    .route('')
    .post(userController.createUser)
    .get(userController.getAllUsers)

router
    .route('/:id')
    .get(userController.getUser)

    .patch(userController.updateUser)

    .delete(authController.protect,
        authController.restrictTo('admin'),
        userController.deleteUser)

//authController.restrictTo('admin'),
module.exports = router;
