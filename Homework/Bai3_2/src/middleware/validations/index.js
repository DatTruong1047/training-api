// validates/index.js

const {validateCreateTodo, validateUpdateTodo} = require('./todos');
const {validateCreateUser, validateUpdateUser} = require('./users');

module.exports = {
    validateCreateTodo,
    validateUpdateTodo,
    validateCreateUser,
    validateUpdateUser
};