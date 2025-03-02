const router = require('express').Router();
const User = require('../models/User');
const {getUsers, createUser, updatedUser, deleteUser} = require('../controllers/user')
const {validateCreateUser, validateUpdateUser} = require('../middleware/validations')

// GET /users
router.get('/',getUsers);
//  POST /users
router.post('/', validateCreateUser,createUser);
// PUT /users/:id
router.put('/:id', validateUpdateUser,updatedUser);
// DELETE /users/:id
router.delete('/:id', deleteUser);

module.exports = router;