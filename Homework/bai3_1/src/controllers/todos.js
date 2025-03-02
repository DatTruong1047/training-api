const User = require('../models/User');
const Todo = require('../models/Todo');

// GET /todos
// Filter & search theo các trường title , status,  dueDate
// Lấy danh sach todo của 1 user

exports.getTodo = async (req, res) => {
    try {
        let query = {};
        const { status, title, dueDate,createdBy} = req.query;
        
        // Fillter
        if(status) { query.status = status };
        if(title) {
            query.title = new RegExp(`${title}`, 'i');
        }
        if(dueDate) {
            query.dueDate = new Date(dueDate);
        }

        console.log(query);
        
        // Lay todo list cua 1 user
        if (createdBy) { query.createdBy = createdBy; }

        // Find
        const todos = await Todo.find(query);
        res.json({todos});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /todos
exports.createTodo = async (req, res) => {
    const todo = new Todo({
        createdBy: req.headers['x-userid'], // Tao theo userid da duoc authen
        status: req.body?.status,
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate,
    });

    try {
        const newTodo = await todo.save();
        res.status(201).json(newTodo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PUT /todos/:id
exports.updateTodo = async (req, res) => {
    try {
        const userId = req.headers['x-userid'];
        const todoId = req.params.id;

        // Cac truong de filter
        const allowedUpdates = ['title', 'status', 'description', 'dueDate'];
        const updates = {};

        allowedUpdates.forEach(update => {
            if (req.body[update] !== undefined) {
                updates[update] = req.body[update];
            }
        });

        // Kiem tra xem user phai nguoi so hu todo do khong
        const todo = await Todo.findById(todoId);
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        if (todo.createdBy.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to update this todo' });
        }

        // Cap nhat todo
        const updatedTodo = await Todo.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        res.json(updatedTodo);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
};

// DELETE /todo/:id
exports.deleteTodo = async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        const userId = req.headers['x-userid'];

        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        if (todo.createdBy.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to update this todo' });
        }

        await todo.deleteOne();
        res.json({ message: 'Todo deleted' });
      
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


