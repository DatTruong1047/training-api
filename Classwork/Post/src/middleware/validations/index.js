// validates/index.js

const {validateCreatePost, validateUpdatePost} = require('./posts.js');
const {validateCreateUser, validateUpdateUser} = require('./user.js');

module.exports = {
    validateCreatePost,
    validateUpdatePost,
    validateCreateUser,
    validateUpdateUser
};