// routes/index.js
const express = require('express');
const router = express.Router();
const todoRoutes = require('./todos.js');
const userRoutes = require('./users.js');

router.use('/todos', todoRoutes);
router.use('/users', userRoutes);

module.exports = router;