const router = require("express").Router();
const Product = require("../models/Product");
const crypto = require('crypto');
require('dotenv').config();


// 1.2 Lấy danh sách tất cả sản phẩm
router.get('/', async (req, res) => {
    try {
      const products = await Product.find();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// Lấy thông tin chi tiết của 1 sản phẩm theo ID
router.get('/:id', async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// Lấy thông tin chi tiết của 1 sản phẩm theo sku
router.get('/:sku', async (req, res) => {
    try {
      const product = await Product.findOne({sku:req.params.sku});
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});


module.exports = router;