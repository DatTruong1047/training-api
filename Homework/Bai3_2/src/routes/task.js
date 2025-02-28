const router = require('express').Router();

const {getTask,getTaskByUserId, createTask, updateTask, deleteTask} = require('../controllers/tasks')
const {validateCreateTask, validateUpdateTask} = require('../middleware/validations')
const verifyUserId = require('../middleware/authen/authen')

// Get tasks
router.get('/',verifyUserId,getTask);
// Create tasks
router.post('/',verifyUserId,validateCreateTask , createTask);
// Update tasks
router.put('/:id',verifyUserId ,validateUpdateTask ,updateTask);
// Delete tasks
router.delete('/:id', verifyUserId ,deleteTask);

module.exports = router;