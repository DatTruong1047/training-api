// validates/index.js

const {validateCreateTask, validateUpdateTask} = require('./taskValidation');
const {validateCreateUser, validateUpdateUser} = require('./userValidation');

module.exports = {
    validateCreateTask,
    validateUpdateTask,
    validateCreateUser,
    validateUpdateUser
};