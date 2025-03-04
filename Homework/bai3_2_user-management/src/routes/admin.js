const router = require("express").Router();
const User = require("../models/User");
const Product = require("../models/Product");
const crypto = require('crypto');
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers["auth-token"];
        if (!token) {
            return res.status(401).json({ message: "Unanthorized" });
        }
        const user = await User.findOne({ authenToken: token });
        if (!user) {
            return res.status(401).json({ message: "Invalid token" });
        }
        req.userInfor = user;
        next();
    } catch (error) {
        return res.status(500).json({ error });
    }
};

/**
 * Lấy role từ userInfor (từ authMiddleware)
 * Kiểm tra quyền
 */
const adminMiddleware = async (req, res, next) => {
    try {
        const role = req.userInfor.role;
        console.log(role);
        if (role !== "admin") {
            return res.status(403).json("You do not have permission");
        }
        next();
    } catch (error) {
        return res.status(400).json({ errors});
    }
};

/**
 * Middleware validate du lieu product gui len
 */
const validateCreateProduct = (req, res, next) => {
    const {name , price, quantity } = req.body;

    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
        return res.status(400).json({ message: nameValidation.message });
    }
    const priceValidation = validatePrice(price);
    if (!priceValidation.valid) {
        return res.status(400).json({ message: priceValidation.message });
    }
    const quantityValidation = validateQuantity(quantity);
    if (!quantityValidation.valid) {
        return res.status(400).json({ message: quantityValidation.message });
    }
    next();
}
const validateUpdateProduct = (req, res, next) => {
    const {name , price, quantity } = req.body;

    if(name) {
        const nameValidation = validateName(name);
        if (!nameValidation.valid) {
            return res.status(400).json({ message: nameValidation.message });
        }
    }
    if(price) {
        const priceValidation = validatePrice(price);
        if (!priceValidation.valid) {
            return res.status(400).json({ message: priceValidation.message });
        }
    }
    if(quantity) {
        const quantityValidation = validateQuantity(quantity);
        if (!quantityValidation.valid) {
            return res.status(400).json({ message: quantityValidation.message });
        }
    }

    next();
}
// GET /users
/**
 * authMiddleware để xác thực đăng nhập
 * adminMiddleware để xác thực quyền
 * Lấy query
 * Lấy danh sach user
 */
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const query = {};
        const { username } = req.query;
        if (username) {
            query.email = new RegExp(`${username}`, "i");
        }
        const users = await User.find(query);
        res.json(users);
    } catch (error) {
        return res.status(500).json({ error });
    }
});

/**
 * 1.1 Thêm sản phẩm mới
 * @api POST /admin/products
 * sku: tự tạo theo name + randomNumber
 */
router.post('/products', validateCreateProduct, authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { name, description, price, quantity, thumbnail, image } = req.body;
      const newProduct = new Product({
        name, description,price,quantity, thumbnail, image
      });
      await newProduct.save();
      res.status(201).json(newProduct);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

/**
 * Cập nhật thông tin sản phẩm theo ID
 * PUT /admin/products
 */
router.put('/products/:id', validateUpdateProduct, async (req, res) => {
    try {
        const {id} = req.params;
        const { name, description, price, quantity, thumbnail, image } = req.body;
        const updatedProduct = null;
        if(name) {
                let product = await Product.findById(id);
                product.name = name || product.name;
                product.description = description || product.description;
                product.price = price || product.price;
                product.quantity = quantity || product.quantity;
                product.thumbnail = thumbnail || product.thumbnail;
                product.image = image || product.email;
                product.updatedAt = Date.now();

                updatedProduct = await product.save();

        }else {
            updatedProduct = await Product.findByIdAndUpdate(
                req.params.id,
                { description, price, quantity, thumbnail, image, updatedAt: Date.now() },
                { new: true } 
            );
        }

        if (!updatedProduct) return res.status(404).json({ error: 'Product not found' });
        
        res.status(200).json({
            dâta :updatedProduct,
            status : "success"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


/**
 * Validation
 */
const validateName = (name) => {
    if (typeof name === 'undefined') {
        return { valid: false, message: 'Name is required' };
    }
    const isValid = name.length >= 3 && name.length <= 50;
    return { valid: isValid, message: isValid ? null : 'Name must be between 3 and 50 characters' };
};

const validatePrice = (price) => {
    if (typeof price === 'undefined') {
        return { valid: false, message: 'Price is required' };
    }
    if (typeof price !== 'number') {
        return { valid: false, message: 'Price must be a number' };
    }

    const isValid = price > 0;
    return { valid: isValid, message: isValid ? null : 'Price must be greater than 0' };
};

const validateQuantity = (quantity) => {
    if (typeof quantity === 'undefined') {
        return { valid: false, message: 'Quantity is required' };
    }
    if (typeof quantity !== 'number') {
        return { valid: false, message: 'Quantity must be a number' };
    }

    const isValid = quantity >= 0;
    return { valid: isValid, message: isValid ? null : 'Quantity must be greater than 0' };
};



module.exports = router;