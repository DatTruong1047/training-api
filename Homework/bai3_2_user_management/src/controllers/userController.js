const User = require('../models/User');
const { verifyPassword } = require('./authController');
const crypto = require('crypto')

/**
 * GET /users
 * Lấy danh sách người dùng
 */
exports.getUsers = async (req, res) => {
    try {
        const query = {};
        const {username} = req.query;

        if (username) {
            query.email = new RegExp(`${username}`, 'i');
        }
        
        const users = await User.find(query);
        res.json(users);
        
    } catch (err) {
        res.status(500).json({message : err.message});
    }
};

/**
 * GET /users/profile
 * Tìm user theo user_id
 * Trả về thông tin cần thiết
 */
exports.getUserProfile = async (req, res) => {
    try {
        const payload = req.payload;
        const user = await User.findById({ _id:payload.userId });

        if(!user) {
            return res.status(404).json({ message : 'User not found'});
        }

        return res.status(200).json({
            data : {
                username : user.username,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            },
            status: 'success'
        })

    } catch (error) {
        res.status(500).json({message : error.message});
    }
}


/**
 * PUT /users/profile
 * Tìm user theo id
 * Cập nhật thông tin người dùng
 */
exports.updatedUserProfile  = async (req, res) => {
    try {
        const payload = req.payload;
        const user = await User.findById({ _id:payload.userId });

        if(!user) {
            return res.status(404).json({ message : 'User not found'});
        }
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        const updatedUser = await user.save();
        res.json({
            data: {
                username: updatedUser.username,
                email: updatedUser.email,
                isVerified: updatedUser.isVerified
            },
            status: 'success'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * PUT /users/change-password
 * Tìm user theo id
 * Gọi hàm verifyPassword để so sanh password 
 * Hash password mới lưu vào db
 */
exports.changeUserPassword  = async (req, res) => {
    try {
        const {oldPassword, newPassword} = req.body;
        const payload = req.payload;
        const user = await User.findById({ _id:payload.userId });
        if(!user) {
            return res.status(404).json({ message : 'User not found'});
        }

        const isPasswordMatch  = verifyPassword(user,oldPassword);
        if(!isPasswordMatch) {
            return res.status(400).json({ message: "Incorrect password"});
        }
        // Mã hóa mk
        const salt = crypto.randomBytes(16).toString('hex')
        const hashPassword = crypto.pbkdf2Sync(newPassword, salt, 1000, 64, 'sha512').toString('hex');
        user.password = `${salt}:${hashPassword}`
        await user.save();

        return res.status(200).json({ status : 'success'})

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
