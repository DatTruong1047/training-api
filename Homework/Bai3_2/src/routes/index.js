// routes/index.js
const express = require('express');
const router = express.Router();
const taskRoutes = require('./task.js');
const userRoutes = require('./users.js');

router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);

module.exports = router;