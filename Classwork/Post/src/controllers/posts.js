const User = require('../models/User');
const Post = require('../models/Post');

// GET /posts
exports.getPosts = async (req, res) => {
    try {
        let query = {};
        let response = {};
        const { nameAuthor, status, userId, date, count } = req.query;

        // Danh sach author theo ten, ten author có thể  trùng
        const authorResult = await filterAuthor(query, nameAuthor);
        if(authorResult.error) { 
            return res.status(404).json({message: authorResult.error});
        }
        query = authorResult.query;

        // Time theo status nếu có 
        if (status) { query.status = status; }

        // Tim theo userid
        if(userId) { query.author = userId; }

        // Loc theo thang nam
        query = filterDate(query, date).query;

        // Dem so bai post
        if(count && userId) {
            postCount= await Post.countDocuments(query);
            response = { postCount, ...response} 
        }
        // Find
        const posts = await Post.find(query);
        response = { posts, ...response}
        res.json(response);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /posts
exports.createPost = async (req, res) => {
    const post = new Post({
        author: req.body.author,
        status: req.body?.status,
        title: req.body.title,
        content: req.body.content,
    });

    try {
        const newPost = await post.save();
        res.status(201).json(newPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PUT /posts/:id
exports.updatePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
};

// DELETE /posts/:id
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post) {
            await post.deleteOne();
            res.json({ message: 'Post deleted' });
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// FilterAuthor
async function filterAuthor(query, nameAuthor) {
    if(nameAuthor){
        const nameUserRegex = new RegExp(`${nameAuthor}$`, 'i')
        const authors = await User.find( {name:nameUserRegex});
        // Khong tim thay tac gia
        if(authors.length === 0) {
            return res.status(404).json({ message: 'Author not found'})    
        }
        // Lay ds id_user
        const authorIds = authors.map(author => author._id);
        query.author = { $in: authorIds };
    }
    return {query}
}

// Filter Date
function filterDate(query, date) {
    if (date) {
        const [month, year] = date.split('-');
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        query.createdAt = {
            $gte: startDate,
            $lte: endDate
        };
    }
    return {query};
}