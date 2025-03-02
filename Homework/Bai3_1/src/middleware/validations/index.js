// validates/index.js

const {validateCreateTask, validateUpdateTask} = require('./tasks');
const {validateCreateUser, validateUpdateUser} = require('./users');

module.exports = {
    validateCreateTask,
    validateUpdateTask,
    validateCreateUser,
    validateUpdateUser
};