const User = require('../models/User');

// GET /users
exports.getUsers = async (req, res) => {
    try {
        const query = {};
        const {emailEnding, ...field} = req.query;

        for (const [key, value] of Object.entries(field)) {
            query[key] = new RegExp(value, 'i');
        }

        if (emailEnding) {
            query.email = new RegExp(`${emailEnding}$`, 'i');
        }
        
        const users = await User.find(query);
        res.json(users);
        
    } catch (err) {
        res.status(500).json({message : err.message});
    }
};

//  POST /users
exports.createUser = async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email
    });

    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PUT /users/:id
exports.updatedUser  = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// DELETE /users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User deleted' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
