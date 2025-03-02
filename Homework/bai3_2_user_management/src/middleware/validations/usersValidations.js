const { body , validationResult} = require('express-validator')
const User = require('../../models/User')
const mongoose = require('mongoose')


const validateChangePasswork = [
    body('oldpassword')
        .isEmpty().withMessage('Old password is required'),
    body('newpassword')
        .isEmpty().withMessage('New password is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errrors: errors.array() });
        }
        next();
    }
]
const validateCreateUser = [
    body('username')
        .notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be a string'),
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email must be a email format'), 

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errrors: errors.array() });
        }
        next();
    }
];

const validateUpdateUser = [
    body('username')
        .optional()
        .notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be a string'),
        
    body('email')
        .optional()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email must be a email format'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errrors: errors.array() });
        }
        next();
    }
];
module.exports = {validateCreateUser, validateUpdateUser, validateChangePasswork};