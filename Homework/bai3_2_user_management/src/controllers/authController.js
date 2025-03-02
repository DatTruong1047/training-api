const User = require('../models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto')
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../services/email');
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;

/**
 * Hàm đăng ký tài khoản 
 * Kiểm tra email đã tồn tại hay chưa
 * Mã hóa mật khẩu
 * Gui email xac nhan
 * Tạo user trên hệ thống
 */
exports.signUp = async (req, res) => {
    try {
        const {email, username, password, role} = req.body;

        // Kiểm tra email
        let user = await User.find({email})
        if(!user) {
            return res.status(400).json({message : 'This email had used'});
        }
        
        // Mã hóa mk
        const salt = crypto.randomBytes(16).toString('hex')
        const hashPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        
        const verificationToken = jwt.sign({email}, SECRET_KEY, {expiresIn: '1h'});
        const verificationLink  = `http://localhost:5050/api/auth/email/verify?token=${verificationToken}`;

        try {
            await sendVerificationEmail(email, verificationLink)
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
        // Tạo user
        user = new User ({
            username,
            email,
            password: `${salt}:${hashPassword}`,
            role: role || 'user',
            isVerified: false

        });
        const newUser = await user.save();
        res.status(200).json({
            data:newUser,
            message:'Create success',
        }).end();
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

/**
 * Đăng nhập :
 * Tìm user qua email cung cấp
 * Kiểm tra mật khẩu 
 * Tạo jwt token 
 */
exports.signIn = async (req, res) => {
    try {
        const {email, password} = req.body;
        // Tìm user
        let user = await User.findOne({email})
        if(!user) {
            return res.status(404).json({message : 'User not found'});
        }

        // Kiểm tra mật khẩu    
        const isPasswordMatch = this.verifyPassword(user,password)
        if(!isPasswordMatch) {
            return res.status(400).json({message : 'Wrong password'})
        }
        
        // Tạo jwt token
        const token = jwt.sign({
            userId: user._id,
            role : user.role || null
        }, SECRET_KEY)

        res.status(200).json({
            token:token,
            message:'Login success',
        }).end();
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

/**
 * Hàm verifyPassword
 * Tách salt và hashPassword từ chuỗi đã lưu trữ
 * Băm lại mật khẩu người dùng nhập bằng 
 * salt đã lưu trữ và so sánh kết quả với hash đã lưu trữ.
 */
exports.verifyPassword = (user, password) => {
    if (!user || !user.password) {
        return false;
    }
    // Tách salt và hashPassword
    const [salt, hashedPassword] = user.password.split(':');
    const providedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    // So sánh
    return hashedPassword === providedHash;
};


exports.verifyEmail = async (req, res) => {
    const { token } = req.query;
  
    try {
      // Xác minh token
      const decoded = jwt.verify(token, SECRET_KEY);
      const email = decoded.email;
      console.log(email);
  
      // Xác nhận email
      let user = await User.findOne({ email });
      console.log(user);
  
      if (user) {
        user.isVerified = true;
        await user.save();
        res.send('Email đã được xác thực thành công!');
      } else {
        res.status(404).send('Không tìm thấy người dùng');
      }
    } catch (error) {
      console.error('Lỗi xác thực email:', error); 
      res.status(400).send('Liên kết xác thực không hợp lệ');
    }
};
  