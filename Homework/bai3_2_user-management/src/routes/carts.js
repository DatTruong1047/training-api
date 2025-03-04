const router = require("express").Router();
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const User = require("../models/User");
const crypto = require('crypto');
require('dotenv').config();


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
 * 2.1 Thêm sản phẩm vào giỏ hàng
 * 2.2 Cập nhật số lượng nếu đã có
 * @api POST /cart
 * Body: { productId, quantity }
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userInfor._id;
        const { productId, quantity } = req.body;

        // Kiểm tra xem sản phẩm có tồn tại không và lấy số lượng tồn kho
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        if (product.quantity < quantity) {
            return res.status(400).json({ error: 'Số lượng sản phẩm vượt quá số lượng có sẵn' });
        }

        // Tìm giỏ hàng của user, nếu chưa có thì tạo mới
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        // Nếu sản phẩm đã tồn tại trong giỏ hàng thì cập nhật số lượng
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
        } else {
            cart.items.push({ product: productId, quantity });
        }

        cart.updatedAt = Date.now();
        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * 2.3 Xóa sản phẩm khỏi giỏ hàng
 * @api DELETE  carts/product/:productId
 */
router.delete('/product/:productId', authMiddleware, async (req, res) => {
    try {
        const userId = req.userInfor._id;
        const { productId } = req.params;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Kiểm tra xem sản phẩm có trong giỏ hàng không
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Product not found in cart' });
        }

        // Xóa sản phẩm khỏi giỏ hàng
        cart.items.splice(itemIndex, 1);

        cart.updatedAt = Date.now();
        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Xem danh sách sản phẩm trong giỏ hàng
 * GET /
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userInfor._id;

        let cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * 2.5 Tính tổng tiền hàng (bao gồm thuế, giảm giá, phí vận chuyển)
 * @pai GET carts/total
 */
router.get('/total', authMiddleware, async (req, res) => {
    try {
        const userId = req.userInfor._id;
        let { taxRate = '0', shippingFee = '0', discount = '0' } = req.query;
        
        taxRate = parseFloat(taxRate) || 0;
        shippingFee = parseFloat(shippingFee) || 0;
        discount = parseFloat(discount) || 0;
        
        console.log(taxRate, shippingFee,discount);
        

        let cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Tính tổng tiền các sản phẩm 
        let productTotal = 0;
        cart.items.forEach(item => {
            productTotal += item.product.price * item.quantity;
        });

        const tax = productTotal * taxRate;
        const total = productTotal + tax + shippingFee - discount;

        // Trả về chi tiết số tiền
        res.status(200).json({
            productTotal,
            tax,
            shippingFee,
            discount,
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
