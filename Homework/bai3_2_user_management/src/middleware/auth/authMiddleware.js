const jwt = require('jsonwebtoken');
const User = require('../../models/User');
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if(!authHeader) {
        return res.status(401).json({message:'Unanthorized'});
    }
    try {
        const token = authHeader.split(' ')[1]
        const payload = jwt.verify(token,SECRET_KEY);

        const user = await User.findById(payload.userId)

        if(!user) {
            return res.status(404).json({ message:'User not found' });
        }

        req.payload = payload;
        next();

    } catch (error) {
        return res.status(400).json({error})
    }
}

module.exports = authMiddleware;