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

// POST /auth/sign-in
/**
 * Kiểm tra user tồn tại chưa qua email
 * Kiểm tra email người dùng đã được được xác thực chưa
 * So sanh mật khẩu nhập vào
 * Tạo authenToken, sử dụng id của user để đảm bảo mỗi token là duy nhất
 * Lưu token vào db
 * Mapping , trả về dữ liệu cần thiết
 */
router.post("/sign-in", async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validation
        const emailValidation = validateEmail(req.body.email);
        if (!emailValidation.valid) {
            return res.status(400).json({ message: emailValidation.message });
        }
        const passwordValidation = validatePassword(req.body.password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.message });
        }

        // Kiêm tra user
        let existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Kiểm tra xác thực email
        if (!existingUser.isVerified) {
            return res.status(401).json({ message: "Account is not verified. Please check your email to verify your account." })
        }

        // So sánh mật khẩu
        const isPasswordMatch = verifyPassword(existingUser, password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Wrong password' })
        }

        // Tao authToken 
        const salt = crypto.randomBytes(16).toString("hex");
        const authToken = crypto
            .pbkdf2Sync(`${existingUser._id}`, salt, 1000, 64, "sha512")
            .toString("hex");
        existingUser.authenToken = authToken;
        await existingUser.save();

        // return
        res.status(200).json({
            data: {
                username: existingUser.username,
                email: existingUser.email,
                role: existingUser.role,
                isVerified: existingUser.isVerified
            },
            token: authToken,
            status: 'Login successful'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// POST /auth/sign-up
/**
 * Validate du lieu dau vao
 * Kiểm tra email, username đã được đăng ký ?
 * Tạo salt, hash mật khẩu, lưu mật khẩu vào db
 * Tạo token để xác thực email
 * Tạo URL gửi qua mail
 * Lưu thông tin user
 */
router.post("/sign-up", async (req, res) => {
    try {
        const { email, username, password, role } = req.body;

        //Validation 
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({ message: emailValidation.message });
        }
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
            return res.status(400).json({ message: usernameValidation.message });
        }
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.message });
        }
        const roleValidation = validateRole(role)
        if (!roleValidation.valid) {
            return res.status(400).json({ message: roleValidation.message });
        }

        // Kiem tra username 
        let existingUsername = await User.findOne({ username })
        if (existingUsername) {
            return res.status(409).json({ message: "This username has already been used" });
        }
        // Kiểm tra email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "This email has already been used" });
        }

        // Hash mật khẩu
        const salt = crypto.randomBytes(16).toString("hex");
        const hashedPassword = crypto
            .pbkdf2Sync(password, salt, 1000, 64, "sha512")
            .toString("hex");

        // Tạo token để xác thực email
        const verificationToken = crypto
            .pbkdf2Sync(email, SECRET_KEY, 1000, 64, "sha512")
            .toString("hex");
        // Tạo URL
        const verificationLink = `http://localhost:5050/api/auth/email/${email}/${verificationToken}`;

        // Xử lý gửi email

        // Lưu user
        let user = new User({
            username,
            email,
            password: `${salt}:${hashedPassword}`,
            role: role || "user",
            isVerified: false,
            verificationToken: verificationToken,
        });
        const newUser = await user.save();

        // return
        res.status(200).json({
            data: {
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                isVerified: newUser.isVerified
            },
            url: verificationLink,
            message: "Registration successful. Please check your email to verify your account.",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// GET /auth/email/:email/:token
/**
 * Tìm user qua email
 * Kiểm tra isVerified
 * So sánh token
 */
router.get("/email/:email/:token", async (req, res) => {
    try {
        const { token, email } = req.params;
        // Tìm user qua email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Kiểm tra isVerified
        if (user.isVerified) {
            return res.status(400).json({ message: "Account already verified" });
        }
        // So sánh token
        if (user.verificationToken !== token) {
            return res.status(400).json({ message: "Invalid verification token" });
        }
        user.isVerified = true;
        await user.save();
        // Return
        res.status(200).json({ message: "Account verified successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /auth/sign-out
/**
 * Lấy thông tin user từ authMiddleware
 * Xóa authenToken của user
 * 
 */
router.post("/sign-out",authMiddleware, async (req, res) => {
    try {
        const user = req.userInfor;

        if (user) {
            user.authenToken = null;
            await user.save();
            return res.status(200).json({
                message: 'Logout success'
            });
        }
        return res.status(400).json({ message: 'Something went wrong' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /reset-password
/**
 * Đăng nhập thì mới cho đổi mật khẩu
 * Lấy thông tin user từ authMiddleware
 * Validate 2 mật khảu nhập vào, mật khẩu giống nhau
 * Gọi hàm verifyPassword để so sanh password 
 * Hash password mới va lưu vào db
 */
router.put("/change-password", authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = req.userInfor;

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Validate 
        if(oldPassword === newPassword) {
            return res.status(400).json({ message: 'Same passwords'});
        }
        const oldPasswordValidation = validatePassword(oldPassword);
        if (!oldPasswordValidation.valid) {
            return res.status(400).json({ message: `${oldPasswordValidation.message} - oldPassword `});
        }
        const newPasswordValidation = validatePassword(newPassword);
        if (!newPasswordValidation.valid) {
            return res.status(400).json({ message: `${newPasswordValidation.message} - newPassword `});
        }
        // verifyPassword
        const isPasswordMatch = verifyPassword(user, oldPassword);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: "Incorrect password" });
        }
        // Mã hóa mk
        const salt = crypto.randomBytes(16).toString('hex')
        const hashPassword = crypto.pbkdf2Sync(newPassword, salt, 1000, 64, 'sha512').toString('hex');
        user.password = `${salt}:${hashPassword}`
        await user.save();

        return res.status(200).json({ status: 'success' })

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// POST /auth/forgot-password
/**
 * Quên mất khẩu - không cần đăng nhập
 * Validate email gửi lên
 * Kiểm tra user
 * Tạo token reset password
 * Tạo url chứa token
 * 
 */
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        //Validation 
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({ message: emailValidation.message });
        }

        // Kiem tra email da ton tai
        const user = await User.findOne({email});
        if(!user) {
            return res.status(400).json({ message: 'Email is not exists'});
        }
        // Tạo token đặt lại mật khẩu
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 giờ
        
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        // Tạo URL 
        const verificationLink = `http://localhost:5050/api/auth/forgot-password/${resetToken}`;
        // Xu ly gui email

        // return
        res.status(200).json({
            url: verificationLink,
            message: "Please check your email to reset your password.",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// GET /auth/forgot-password/:token
/**
 * Lấy token từ params
 * Tìm kiếm user theo token-reset-password
 * Nếu user tồn tại -> accept 
 */
router.get('/forgot-password/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        res.status(200).json({ message: 'Accept reset password' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// PUT /auth/forgot-password/:token
/**
 * Lấy token từ params
 * Lấy password gửi lên , validate
 * Tìm kiếm user theo resetToken
 * Hash mật khẩu
 * Xóa resetToken
 * 
 */
router.put('/forgot-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.message });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hashedPassword = crypto
            .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
            .toString('hex');
        user.password = `${salt}:${hashedPassword}`;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


/**
 * Route: Gửi lại email xác thực
 * Validate email
 * Tạo token để xác thực email
 * Trả về URL
 */
router.get("/resent-email/:email", async (req, res) => {
    try {
        const {email} = req.params;

        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({ message: emailValidation.message });
        }
        // Tạo token để xác thực email
        const verificationToken = crypto
            .pbkdf2Sync(email, SECRET_KEY, 1000, 64, "sha512")
            .toString("hex");
        // Tạo URL
        const verificationLink = `http://localhost:5050/api/auth/email/${email}/${verificationToken}`;
        // return
        res.status(200).json({
            url : verificationLink
        })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


/**
 * Func: xác thực mật khẩu
 * Kiểm tra param nhập vào 
 * Tách hashedPassword được lưu trên db
 * Hash password người dùng nhập vào
 * So sánh 2 password
 */
const verifyPassword = (user, password) => {
    if (!user || !user.password) {
        return false;
    }
    // Tách salt và hashPassword
    const [salt, hashedPassword] = user.password.split(':');
    // Hash password
    const providedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    // So sánh
    return hashedPassword === providedHash;
};


/**
 * Func: Lấy salt từ hashPassword
 * Kiểm tra param nhập vào 
 * Kiểm tra đinh dạng
 * Lấy phần tử đầu tiên là salt
 */
const getSaltFromPassword = (storedPassword) => {
    if (!storedPassword) {
        return null;
    }

    const parts = storedPassword.split(':');
    if (parts.length !== 2) {
        return null;
    }

    return parts[0];
}


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
const validatePassword = (password) => {
    if (typeof password === 'undefined') {
        return { valid: false, message: 'Password is required' };
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
    const isValid = password && password.length >= 8 && passwordRegex.test(password);
    return { valid: isValid, message: isValid ? null : 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character' };
};

const validateRole = (role) => {
    if (typeof role === 'undefined') {
        return { valid: false, message: 'Role is required' };
    }
    const validRoles = ['admin', 'user'];
    const isValid = validRoles.includes(role);
    return { valid: isValid, message: isValid ? null : 'Role must be either "admin" or "user"' };
};

module.exports = router;
