// routes/index.js
const express = require('express');
const router = express.Router();
const taskRoutes = require('./taskRoutes.js');
const userRoutes = require('./userRoutes.js');

router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);

module.exports = router;