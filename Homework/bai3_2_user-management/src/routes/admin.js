const router = require("express").Router();
const User = require("../models/User");
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
            return res.status(404).json({ message: "User not found" });
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
        return res.status(400).json({ error });
    }
};

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

module.exports = router;