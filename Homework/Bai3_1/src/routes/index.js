// routes/index.js
const express = require('express');
const router = express.Router();
const taskRoutes = require('./taskRoute.js');
const userRoutes = require('./usersRoute.js');

router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);

module.exports = router;