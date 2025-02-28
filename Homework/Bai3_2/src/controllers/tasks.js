const User = require('../models/User');
const Task = require('../models/Task');

// GET /tasks
// Filter & search theo các trường title , status,  dueDate
exports.getTask = async (req, res) => {
    try {
        let query = {};
        // Fillter
        query = filterTasks(req.query);
        // Find
        const tasks = await Task.find(query);

        res.json({tasks});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /user/:user_id/tasks
// Lấy danh sach task của 1 user
exports.getTaskByUserId = async (req, res) => {
    try {
        let query = {};
        const {user_id} = req.params;

        const existsUser = await User.findById(user_id)
        if(!existsUser){
            return res.status(404).json({message:'User not found'});
        }

        // Fillter
        query = filterTasks(req.query);

        // Lay task list cua 1 user
        if (user_id) { query.createdBy = user_id; }

        // Find
        const tasks = await Task.find(query);
        res.json({tasks});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// POST /tasks
exports.createTask = async (req, res) => {
    const task = new Task({
        createdBy: req.headers['x-userid'], // Tao theo userid da duoc authen
        status: req.body?.status,
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate,
    });

    try {
        const newTask= await task.save();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PUT /tasks/:id
exports.updateTask = async (req, res) => {
    try {
        const userId = req.headers['x-userid'];
        const taskId = req.params.id;

        // Cac truong de filter
        const allowedUpdates = ['title', 'status', 'description', 'dueDate'];
        const updates = {};

        allowedUpdates.forEach(update => {
            if (req.body[update] !== undefined) {
                updates[update] = req.body[update];
            }
        });

        // Kiem tra xem user phai nguoi so hu task do khong
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        if (task.createdBy.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to update this task' });
        }

        // Cap nhat task
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        res.json(updatedTask);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
};

// DELETE /tasks/:id
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        const userId = req.headers['x-userid'];

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        if (task.createdBy.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to update this task' });
        }

        await task.deleteOne();
        res.json({ message: 'Task deleted' });
      
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const filterTasks = (obj) =>{
    let query = {}
    if(obj.status) { query.status = obj.status };
    if(obj.title) {
        query.title = new RegExp(`${obj.title}`, 'i');
    }
    if(obj.dueDate) {
        query.dueDate = new Date(obj.dueDate);
    }
    return query;
}