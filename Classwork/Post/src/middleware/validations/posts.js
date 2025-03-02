const { body , validationResult} = require('express-validator')
const User = require('../../models/User')
const mongoose = require('mongoose')

const validateGetPost = [
    
]

const validateCreatePost = [
    body('author')
        .notEmpty().withMessage("Author is required")
        .isMongoId().withMessage('Author must be a valid MongoDB ObjectId')
        .custom(async (value) => {
            const user = await User.findById(value);
            if(!user) {
                return Promise.reject('User not found');
            }
        }),
    body('title')
        .notEmpty().withMessage('Title is required')
        .isString().withMessage('Title must be a string'),

    body('content')
        .notEmpty().withMessage('Content is required')
        .isString().withMessage('Content must be a string')
        .isLength({ min: 10 }).withMessage('Content must be at least 10 characters long'), 

    body('status')
        .optional()
        .isBoolean().withMessage('Status must be a boolean'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errrors: errors.array() });
        }
        next();
    }
];

const validateUpdatePost = [
    body('author')
        .optional()
        .notEmpty().withMessage("Author is required")
        .isMongoId().withMessage('Author must be a valid MongoDB ObjectId')
        .custom(async (value) => {
            const user = await User.findById(value);
            if(!user) {
                return Promise.reject('User not found');
            }
        }),
    body('title')
        .optional()
        .notEmpty().withMessage('Title is required')
        .isString().withMessage('Title must be a string'),

    body('content')
        .optional()
        .notEmpty().withMessage('Content is required')
        .isString().withMessage('Content must be a string')
        .isLength({ min: 10 }).withMessage('Content must be at least 10 characters long'), 

    body('status')
        .optional()
        .isBoolean().withMessage('Status must be a boolean'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errrors: errors.array() });
        }
        next();
    }
];
module.exports = {validateCreatePost, validateUpdatePost};