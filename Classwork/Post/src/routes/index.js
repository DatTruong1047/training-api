// routes/index.js
const express = require('express');
const router = express.Router();
const postRoutes = require('./posts.js');
const userRoutes = require('./users.js');

router.use('/posts', postRoutes);
router.use('/users', userRoutes);

module.exports = router;