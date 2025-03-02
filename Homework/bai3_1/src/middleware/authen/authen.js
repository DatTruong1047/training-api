require('dotenv').config();
const User = require('../../models/User')

const  verifyUserId = async (req, res, next) => {
    // Authen 
    // Lay id user gui len 
    const userId= req.headers['x-userid'];
    if (!userId) {
        return res.status(400).json({ message: 'UserId not found' });
    }

    // Kiem tra user trong he thong 
    const isExistsUser =  await User.exists({_id:userId})  
    if (!isExistsUser) {
        return res.status(401).json({ message: 'Invalid verify code' });
    }
    
    next();
}

module.exports = verifyUserId;