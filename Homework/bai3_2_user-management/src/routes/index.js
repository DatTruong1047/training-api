const express = require('express')
const router = express.Router();
const authRoutes = require('./auth');
const userRoutes = require('./users');
const adminRoutes = require('./admin');
const productRoutes = require('./products');
const cartRoutes = require('./carts');
const orderRoutes = require('./orders');

router.use('/auth',authRoutes);
router.use('/users',userRoutes);
router.use('/admin',adminRoutes);
router.use('/products',productRoutes);
router.use('/carts',cartRoutes);
router.use('/orders',orderRoutes);
module.exports = router