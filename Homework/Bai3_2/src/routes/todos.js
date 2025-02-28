const router = require('express').Router();
const User = require('../models/User');
const Post = require('../models/Todo');

const {getTodo, createTodo, updateTodo, deleteTodo} = require('../controllers/todos')
const {validateCreateTodo, validateUpdateTodo} = require('../middleware/validations')
const verifyUserId = require('../middleware/authen/authen')

// Get todos
router.get('/',verifyUserId,getTodo);
// Create todos
router.post('/',verifyUserId,validateCreateTodo , createTodo);
// Update todos
router.put('/:id',verifyUserId ,validateUpdateTodo ,updateTodo);
// Delete todos
router.delete('/:id', verifyUserId ,deleteTodo);

module.exports = router;