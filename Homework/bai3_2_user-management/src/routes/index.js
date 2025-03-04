const express = require('express')
const router = express.Router();
const authRoutes = require('./auth');
const userRoutes = require('./users');
const adminRoutes = require('./admin');

router.use('/auth',authRoutes);
router.use('/users',userRoutes);
router.use('/admin',adminRoutes);
module.exports = router