const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

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
 * 1 - Tạo đơn hàng mới từ giỏ hàng
 * @api POST /orders/
 * @ideal 
 * - Nhan vao danh sách productIds
 * - Các giá trị taxRate, shippingFee, discount
 * - Tìm giỏ hàng của user và populate thông tin sản phẩm
 * - Lọc các sản phẩm trong giỏ hàng dựa trên danh sách productIds được gửi lên
 * - Tính tổng tiền và chuẩn bị danh sách sản phẩm 
 * - Tạo mới đơn hàng
 * - Loại bỏ các sản phẩm vừa mua khỏi giỏ hàng
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userInfor._id;
        const { productIds } = req.body;  // productIds là mảng các id sản phẩm được mua
        let { taxRate = '0', shippingFee = '0', discount = '0' } = req.query;

        taxRate = parseFloat(taxRate) || 0;
        shippingFee = parseFloat(shippingFee) || 0;
        discount = parseFloat(discount) || 0;

        // Kiểm tra xem có gửi danh sách productIds không
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ error: 'No productIds provided' });
        }

        // Tìm giỏ hàng của user và populate thông tin sản phẩm
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Lọc các sản phẩm trong giỏ hàng dựa trên danh sách productIds được gửi lên
        const filteredItems = cart.items.filter(item =>
            productIds.includes(item.product._id.toString())
        );

        if (filteredItems.length === 0) {
            return res.status(400).json({ error: 'No matching products in cart' });
        }

        // Tính tổng tiền và chuẩn bị danh sách sản phẩm 
        let productTotal = 0;
        const orderItems = filteredItems.map(item => {
            productTotal += item.product.price * item.quantity;
            return {
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price
            };
        });

        const tax = productTotal * taxRate;
        const total = productTotal + tax + shippingFee - discount;

        // Tạo mới đơn hàng
        const newOrder = new Order({
            user: userId,
            items: orderItems,
            total: total,
            status: 'pending'
        });
        await newOrder.save();

        // Loại bỏ các sản phẩm vừa mua khỏi giỏ hàng
        cart.items = cart.items.filter(item =>
            !productIds.includes(item.product._id.toString())
        );
        cart.updatedAt = Date.now();
        await cart.save();

        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 *  2 3 6 - Quản lý trạng thái đơn hàng, Xác nhận đơn hàng, Hủy đơn hàng
 *  @api PUT /orders/:orderId/change-status/:status
 *  @ideal 
 *  -  Luồng chuyển giữa các status:
 *     pending   -> cancelled | confirmed 
 *     confirmed -> processing
 *     processing-> cancelled | delivered
 *  - Validate status
 *  - Lay order theo id, user_id
 *  - Kiem tra logic giua cac status
 *  - Neu status la confirmed -> giảm sl sp trong kho
 *  - Neu status la cancelled -> tang sl sp trong kho
 *  - Luu status
 */
router.put('/:orderId/change-status/:status', authMiddleware, async (req, res) => {
    try {
        const { orderId, status } = req.params;
        const userId = req.userInfor._id;

        // Định nghĩa các chuyển đổi trạng thái hợp lệ
        const allowedTransitions = {
            pending: ['confirmed','cancelled'],
            confirmed: ['processing'],
            processing: ['delivered', 'cancelled'],
            cancelled: [],
        };

        const order = await Order.findById({
            _id: orderId,
            user:userId
        });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Validate status
        if (!allowedTransitions[status]) {
            return res.status(400).json({ error: `Invalid status ${status} ` });
        }

        // Kiểm tra trang thai hiện tại là tthai cuoi cung ch
        if (!allowedTransitions[order.status]) {
            return res.status(400).json({ error: `No allowed transitions from ${order.status} state.` });
        }
        // Kiem tra trang thai moi có dc phep chuyen hay k
        if (!allowedTransitions[order.status].includes(status)) {
            return res.status(400).json({ error: `Invalid status transition from ${order.status} to ${status}.` });
        }
        // status = confirmed -> giảm sl trong kho
        if (status === 'confirmed') {
            try {
                await updateInventory(order);
            } catch (inventoryError) {
                return res.status(400).json({ error: inventoryError.message });
            }
        }
        // status = cancelled -> tang sl trong kho
        if (status === 'cancelled') {
            try {
                await restoreInventory(order);
            } catch (restoreError) {
                return res.status(400).json({ error: restoreError.message });
            }
        }
        // Cập nhật trạng thái đơn hàng 
        order.status = status;
        order.updatedAt = Date.now();
        await order.save();
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



/**
 * 5. Xem chi tiết đơn hàng
 * @api GET /orders/:orderId
 */
router.get('/:orderId', authMiddleware, async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await Order.findById(orderId).populate('items.product');
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.status(200).json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

/**
 * Hàm giảm sl sản phẩm trong kho, nếu status = delivered
 * Nếu không đủ số lượng, hàm sẽ trả về lỗi.
 * 
 * @param {Object} order - Đơn hàng .
 * @throws {Error} Nếu không tìm thấy sản phẩm hoặc số lượng không đủ.
 */
async function updateInventory(order) {
    for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (!product) {
            throw new Error(`Product with ID ${item.product} not found.`);
        }
        if (product.qty < item.quantity) {
            throw new Error(`Insufficient inventory for product ${product.name}.`);
        }
        // Sử dụng $inc để trừ số lượng tồn kho
        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
    }
}

/**
 * Hàm tăng sl sản phẩm trong kho, nếu status = cancelled
 * Nếu không đủ số lượng, hàm sẽ trả về lỗi.
 *
 * @param {Object} order - Đơn hàng 
 * @throws {Error} Nếu không tìm thấy sản phẩm.
 */
async function restoreInventory(order) {
    for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (!product) {
            throw new Error(`Product with ID ${item.product} not found.`);
        }
        // Tăng số lượng tồn kho 
        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
    }
}

module.exports = router;