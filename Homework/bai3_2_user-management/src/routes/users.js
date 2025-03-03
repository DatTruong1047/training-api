const router = require("express").Router();
const User = require("../models/User");
const crypto = require("crypto");

/**
 * Lấy token từ header
 * Tìm user tương ứng
 */
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
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
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
 *
 * GET /users/profile
 * Router: Lấy thông tin người dùng
 * Sử dụng thông tin user có từ authMiddleware
 * Mapping và trả về thông tin cần thiết
 *
 */
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = req.userInfor;
        if (user) {
            return res
                .status(200)
                .json({
                    data: {
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        isVerified: user.isVerified,
                    },
                    status: "success",
                })
                .end();
        }
        return res
            .status(400)
            .json({ message: "Something was wrong with user infor" });
    } catch (error) {
        return res.status(500).json({ error });
    }
});

/**
 *
 * PUT /users/profile
 * Router: Cập nhật thông tin người dùng
 * Sử dụng thông tin user có từ authMiddleware
 * Kiểm tra username, email đã được người khác sử dụng ?
 * Cập nhật thông tin
 *
 */
router.put("/profile", authMiddleware, async (req, res) => {
    try {
        const user = req.userInfor;
        const { username, email } = req.body;
        if (username) {
            const usernameValidation = validateUsername(username);
            if (!usernameValidation.valid) {
                return res.status(400).json({ message: usernameValidation.message });
            }
        }
        if (email) {
            const emailValidation = validateEmail(email);
            if (!emailValidation.valid) {
                return res.status(400).json({ message: emailValidation.message });
            }
        }
        // Kiểm tra username, email đã được người khác sử dụng ?
        const existingUsernameUser = await User.findOne({ username });
        if(existingUsernameUser && existingUsernameUser._id.toString() !== user._id.toString()){
            return res.status(400).json({message : 'This username has already been used'});
        }
        const existingEmailUser = await User.findOne({ email });
        if(existingEmailUser && existingEmailUser._id.toString() !== user._id.toString()){
            return res.status(400).json({message : 'This email has already been used'});
        }

        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        const updatedUser = await user.save();

        return res
            .status(200)
            .json({
                data: {
                    username: updatedUser.username,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    isVerified: updatedUser.isVerified,
                },
                status: "success",
            })
            .end();
    } catch (error) { 
        res.status(500).json({ message: error.message });
    }
});




/**
 * Validation
 */
const validateEmail = (email) => {
    if (typeof email === 'undefined') {
        return { valid: false, message: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    return { valid: isValid, message: isValid ? null : 'Invalid email format' };
};

const validateUsername = (username) => {
    if (typeof username === 'undefined') {
        return { valid: false, message: 'Username is required' };
    }
    const isValid = username.length >= 3 && username.length <= 20;
    return { valid: isValid, message: isValid ? null : 'Username must be between 3 and 20 characters' };
};



module.exports = router;
