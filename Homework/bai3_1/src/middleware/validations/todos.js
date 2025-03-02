const { body , validationResult} = require('express-validator')
const User = require('../../models/User')
const mongoose = require('mongoose')

const validateCreateTodo = [
    body('title')
        .notEmpty().withMessage('Title is required')
        .isString().withMessage('Title must be a string'),
    body('description')
        .optional()
        .isString().withMessage('Description must be a string'),
    body('status')
        .optional()
        .isIn(['pending', 'in_progress', 'completed']).withMessage('Status must be one of: pending, in_progress, completed'),
    body('dueDate')
        .optional()
        .isISO8601().withMessage('DueDate must be a valid date'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errrors: errors.array() });
        }
        next();
    }
];

const validateUpdateTodo = [
    body('title')
        .optional()
        .isString().withMessage('Title must be a string'),
    body('description')
        .optional()
        .isString().withMessage('Description must be a string'),
    body('status')
        .optional()
        .isIn(['pending', 'in_progress', 'completed']).withMessage('Status must be one of: pending, in_progress, completed'),
    body('dueDate')
        .optional()
        .isISO8601().withMessage('DueDate must be a valid date'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errrors: errors.array() });
        }
        next();
    }
];
module.exports = {validateCreateTodo, validateUpdateTodo};