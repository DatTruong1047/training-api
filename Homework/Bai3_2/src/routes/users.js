const router = require('express').Router();
const User = require('../models/User');
const {getUsers, createUser, updatedUser, deleteUser} = require('../controllers/users')
const {validateCreateUser, validateUpdateUser} = require('../middleware/validations');
const { getTaskByUserId } = require('../controllers/tasks');
const verifyUserId = require('../middleware/authen/authen');

// GET /users
router.get('/',getUsers);
// Get tasks by id user
router.get('/:user_id/tasks',verifyUserId,getTaskByUserId);
//  POST /users
router.post('/', validateCreateUser,createUser);
// PUT /users/:id
router.put('/:id', validateUpdateUser,updatedUser);
// DELETE /users/:id
router.delete('/:id', deleteUser);

module.exports = router;