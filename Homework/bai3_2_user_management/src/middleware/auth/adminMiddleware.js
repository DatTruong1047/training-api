const User = require('../../models/User');

/**
 * Lấy thông tin trong payload
 * Kiểm tra thông tin phải admin không
 */
const adminMiddleware = async (req, res, next) => {
    try {
        const role = req.payload.role;
        console.log(role);
        
        if(role !== 'admin') {
            return res.status(403).json('You do not have permission');
        }
        next()
    } catch (error) {
        return res.status(400).json({error})
    }
}

module.exports = adminMiddleware;